import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getEffectivePlan, isPaidPlan } from "@/lib/planOverride";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Authenticate the Cron request
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Define the time range for "tomorrow"
    const now = new Date();
    
    // Start of tomorrow
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    // End of tomorrow
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // 3. Find all confirmed bookings happening tomorrow that haven't had a reminder sent
    const bookings = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        reminderSent: false,
        bookingTime: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        }
      },
      include: {
        business: true,
        service: true,
      }
    });

    if (bookings.length === 0) {
      return NextResponse.json({ success: true, message: "No reminders to send." });
    }

    const results = {
      totalFound: bookings.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // 4. Process each booking
    for (const booking of bookings) {
      const business = booking.business;
      
      // Skip if business doesn't have WhatsApp credentials configured
      if (!business.metaPhoneNumberId || !business.metaPermanentToken) {
        results.skipped++;
        continue;
      }

      // Skip if business is not on a paid plan
      const effectivePlan = getEffectivePlan(business.plan);
      if (!isPaidPlan(effectivePlan)) {
        results.skipped++;
        continue;
      }

      // Format time for the message
      const dateObj = new Date(booking.bookingTime);
      const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      // Send the reminder
      try {
        const result = await sendWhatsAppTemplate(
          business.metaPhoneNumberId,
          business.metaPermanentToken,
          booking.customerPhone,
          "appointment_reminder",
          [booking.customerName, booking.service.name, timeFormatted]
        );

        if (result.success) {
          // Mark as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true }
          });
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Booking ${booking.id}: ${result.error}`);
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Booking ${booking.id}: ${err.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron job completed.",
      results
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
