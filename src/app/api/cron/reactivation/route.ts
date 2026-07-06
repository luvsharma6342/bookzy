import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    // 45 days ago threshold (change to 1 minute for local testing if needed)
    const thresholdDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes (TESTING)
    // const thresholdDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days

    // Find all completed bookings older than the threshold where we haven't sent a reactivation yet
    const oldBookings = await prisma.booking.findMany({
      where: {
        status: "completed",
        reactivationSent: false,
        bookingTime: {
          lte: thresholdDate
        }
      },
      include: {
        business: true
      },
      take: 50 // process in batches
    });

    if (oldBookings.length === 0) {
      return NextResponse.json({ success: true, message: "No pending reactivation campaigns to send" });
    }

    let processedCount = 0;
    let reactivationsSentCount = 0;

    for (const booking of oldBookings) {
      const { business } = booking;
      
      // Skip if business hasn't configured WhatsApp
      if (!business.metaPhoneNumberId || !business.metaPermanentToken) {
        // Mark as sent so we don't keep checking it forever if they never set up WhatsApp
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reactivationSent: true }
        });
        continue;
      }

      // Check if this customer has any NEWER bookings (meaning they are not actually churned)
      const newerBookingsCount = await prisma.booking.count({
        where: {
          businessId: business.id,
          customerPhone: booking.customerPhone,
          bookingTime: {
            gt: thresholdDate
          }
        }
      });

      if (newerBookingsCount === 0) {
        // Customer is officially churned (no bookings since the threshold)! 
        // Send the reactivation campaign!
        try {
          await sendWhatsAppTemplate(
            business.metaPhoneNumberId,
            business.metaPermanentToken,
            booking.customerPhone,
            "reactivation_campaign",
            [booking.customerName] // Pass customer name to {{1}}
          );
          reactivationsSentCount++;
        } catch (error) {
          console.error("Failed to send reactivation campaign:", error);
        }
      }

      // Always mark this old booking as processed, whether we sent a message or they were active anyway
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reactivationSent: true }
      });
      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      messagesSent: reactivationsSentCount 
    });

  } catch (error: any) {
    console.error("Error in reactivation cron:", error);
    return NextResponse.json({ error: error.message || "Failed to process reactivation campaigns" }, { status: 500 });
  }
}
