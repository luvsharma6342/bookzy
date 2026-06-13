import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheGet, cacheSet, cacheDel, cacheKeys, TTL } from "@/lib/redis";
import { getEffectivePlan, isPaidPlan } from "@/lib/planOverride";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  // Try cache first (short TTL — bookings change frequently)
  const cached = await cacheGet(cacheKeys.bookings(businessId));
  if (cached) return NextResponse.json(cached);

  const bookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { bookingTime: "desc" },
  });

  await cacheSet(cacheKeys.bookings(businessId), bookings, TTL.BOOKINGS);
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      serviceId,
      staffId,
      customerName,
      customerPhone,
      bookingTime,
      price,
      bookingSource,
      notes,
    } = body;

    if (!businessId || !serviceId || !customerName || !customerPhone || !bookingTime || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        businessId,
        serviceId,
        staffId: staffId && !staffId.startsWith("st-") ? staffId : null,
        customerName,
        customerPhone,
        bookingTime: new Date(bookingTime),
        price: parseFloat(price),
        status: "pending",
        bookingSource: bookingSource || "whatsapp_link",
        notes: notes || "",
      },
    });

    // Create booking_created analytic event
    await prisma.analyticsEvent.create({
      data: { businessId, eventType: "booking_created", timestamp: new Date() },
    });

    // Invalidate bookings cache so dashboard and storefront get fresh data
    await cacheDel(cacheKeys.bookings(businessId));

    // Automated WhatsApp Trigger on creation
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId }
      });

      if (business && isPaidPlan(getEffectivePlan(business.plan)) && business.metaPhoneNumberId && business.metaPermanentToken) {
        const service = await prisma.service.findUnique({
          where: { id: serviceId }
        });

        let staffName = "Any Staff";
        if (staffId && !staffId.startsWith("st-")) {
          const staff = await prisma.staff.findUnique({
            where: { id: staffId }
          });
          if (staff) {
            staffName = staff.name;
          }
        }

        const dateObj = new Date(bookingTime);
        const timeFormatted = dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }) + " at " + dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        const { sendWhatsAppTemplate } = await import("@/lib/whatsapp");
        await sendWhatsAppTemplate(
          business.metaPhoneNumberId,
          business.metaPermanentToken,
          customerPhone,
          "booking_confirmation",
          [customerName, service?.name || "Service", timeFormatted, staffName]
        );
      }
    } catch (waErr) {
      console.error("Failed to trigger automated WhatsApp confirmation:", waErr);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.business.ownerId && booking.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    // Invalidate bookings cache on status change
    await cacheDel(cacheKeys.bookings(booking.businessId));

    // Automated WhatsApp Trigger on no-show
    if (status === "no_show" && booking.business.metaPhoneNumberId && booking.business.metaPermanentToken && isPaidPlan(getEffectivePlan(booking.business.plan))) {
      try {
        const service = await prisma.service.findUnique({
          where: { id: booking.serviceId }
        });

        const { sendWhatsAppTemplate } = await import("@/lib/whatsapp");
        await sendWhatsAppTemplate(
          booking.business.metaPhoneNumberId,
          booking.business.metaPermanentToken,
          booking.customerPhone,
          "no_show_followup",
          [booking.customerName, service?.name || "Service"]
        );
      } catch (waErr) {
        console.error("Failed to trigger automated WhatsApp no-show follow-up:", waErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}
