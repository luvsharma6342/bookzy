import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const events = await prisma.analyticsEvent.findMany({
    where: { businessId },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, eventType } = body;

    if (!businessId || !eventType) {
      return NextResponse.json({ error: "businessId and eventType are required" }, { status: 400 });
    }

    if (!["page_view", "book_now_click", "booking_created"].includes(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        businessId,
        eventType,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Error logging analytics event:", error);
    return NextResponse.json({ error: error.message || "Failed to log event" }, { status: 500 });
  }
}
