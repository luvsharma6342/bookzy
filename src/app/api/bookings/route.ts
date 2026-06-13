import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { bookingTime: "desc" },
  });

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

    // Standard booking creation on client side (or chatbot)
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

    // Create a companion booking_created analytic event
    await prisma.analyticsEvent.create({
      data: {
        businessId,
        eventType: "booking_created",
        timestamp: new Date(),
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    // Verify ownership
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}
