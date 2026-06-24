import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFreeBusy } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const staffId = searchParams.get("staffId"); // optional

  if (!businessId || !dateStr) {
    return NextResponse.json({ error: "businessId and date are required" }, { status: 400 });
  }

  try {
    // Parse date as local time range, or we can just use UTC if the storefront sends local midnight UTC equivalent.
    // Assuming dateStr is 'YYYY-MM-DD', we construct start and end for the 24 hour period in local or UTC.
    // For safety, let's look at +-12h from noon UTC.
    const noon = new Date(`${dateStr}T12:00:00.000Z`);
    const checkStart = new Date(noon.getTime() - 14 * 60 * 60 * 1000);
    const checkEnd = new Date(noon.getTime() + 14 * 60 * 60 * 1000);

    let whereClause: any = {
      businessId,
      bookingTime: {
        gte: checkStart,
        lte: checkEnd,
      },
      status: { in: ["confirmed", "pending"] },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: { service: true }
    });

    let googleBusyBlocks: any[] = [];

    if (staffId) {
      const blocks = await getFreeBusy(staffId, checkStart, checkEnd);
      googleBusyBlocks = blocks.map((b: any) => ({ ...b, staffId }));
    } else {
      // If checking for any staff, we should ideally check all staff connected to Google
      const allStaff = await prisma.staff.findMany({
        where: { businessId },
        include: { googleSync: true }
      });
      
      const syncPromises = allStaff
        .filter(s => s.googleSync)
        .map(async (s) => {
          const blocks = await getFreeBusy(s.id, checkStart, checkEnd);
          return blocks.map((b: any) => ({ ...b, staffId: s.id }));
        });
        
      const results = await Promise.all(syncPromises);
      googleBusyBlocks = results.flat();
    }

    return NextResponse.json({
      bookings,
      googleBusyBlocks,
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
