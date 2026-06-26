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

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  // We bypass Redis cache here because pagination combinations are vast and bookings change frequently.
  // We'll rely on SWR client-side caching.
  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId },
      orderBy: { bookingTime: "desc" },
      skip,
      take: limit,
      include: {
        service: { select: { name: true, duration: true } } // include basic service details
      }
    }),
    prisma.booking.count({ where: { businessId } })
  ]);

  return NextResponse.json({
    data: bookings,
    metadata: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
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

    // Overlap/Double-Booking Prevention
    const resolvedStaffId = staffId && !staffId.startsWith("st-") ? staffId : null;
    if (resolvedStaffId) {
      const requestedService = await prisma.service.findUnique({
        where: { id: serviceId }
      });

      if (!requestedService) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      const newStart = new Date(bookingTime);
      const newEnd = new Date(newStart.getTime() + requestedService.duration * 60 * 1000);

      // Query bookings for same staff around same day (+-12h range for efficiency)
      const checkStart = new Date(newStart.getTime() - 12 * 60 * 60 * 1000);
      const checkEnd = new Date(newStart.getTime() + 12 * 60 * 60 * 1000);

      const existingBookings = await prisma.booking.findMany({
        where: {
          staffId: resolvedStaffId,
          status: { in: ["confirmed", "pending"] },
          bookingTime: {
            gte: checkStart,
            lte: checkEnd
          }
        },
        include: {
          service: true
        }
      });

      for (const existing of existingBookings) {
        const existingStart = new Date(existing.bookingTime);
        const existingEnd = new Date(existingStart.getTime() + existing.service.duration * 60 * 1000);

        if (existingStart < newEnd && existingEnd > newStart) {
          return NextResponse.json(
            { error: "This time slot is already booked. Please choose a different time." },
            { status: 409 }
          );
        }
      }
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

    // Google Calendar Sync
    if (booking.staffId) {
      try {
        const { createCalendarEvent } = await import("@/lib/googleCalendar");
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        const endTime = new Date(new Date(bookingTime).getTime() + (service?.duration || 30) * 60000);
        
        const gEvent = await createCalendarEvent(booking.staffId, {
          summary: `Booking: ${service?.name || "Service"} - ${customerName}`,
          description: `Customer: ${customerName}\nPhone: ${customerPhone}\nNotes: ${notes || "None"}`,
          start: { dateTime: new Date(bookingTime).toISOString() },
          end: { dateTime: endTime.toISOString() },
        });

        if (gEvent?.id) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: gEvent.id }
          });
        }
      } catch (gErr) {
        console.error("Failed to sync booking to Google Calendar:", gErr);
      }
    }

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

    // Google Calendar Sync Update
    if (updated.staffId && updated.googleEventId) {
      try {
        const { deleteCalendarEvent } = await import("@/lib/googleCalendar");
        if (status === "cancelled" || status === "no_show") {
          await deleteCalendarEvent(updated.staffId, updated.googleEventId);
          await prisma.booking.update({
            where: { id },
            data: { googleEventId: null }
          });
        }
      } catch (gErr) {
        console.error("Failed to delete Google Calendar event:", gErr);
      }
    }

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
