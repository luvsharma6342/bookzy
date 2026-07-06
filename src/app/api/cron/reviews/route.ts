import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    // Calculate the threshold time (2 hours ago)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find all completed bookings where review hasn't been requested, 
    // and completedAt is older than 2 hours.
    const pendingReviews = await prisma.booking.findMany({
      where: {
        status: "completed",
        reviewRequested: false,
        completedAt: {
          lte: twoHoursAgo
        }
      },
      include: {
        business: true
      },
      take: 50 // process in batches to avoid timeout
    });

    if (pendingReviews.length === 0) {
      return NextResponse.json({ success: true, message: "No pending reviews to process" });
    }

    let processedCount = 0;
    let failedCount = 0;

    for (const booking of pendingReviews) {
      const { business } = booking;
      
      // Skip if business hasn't configured WhatsApp or Google Maps URL
      if (!business.metaPhoneNumberId || !business.metaPermanentToken || !business.googleMapsUrl) {
        // We could mark it as reviewRequested = true to avoid checking it forever, 
        // but it's better to just leave it in case they configure it later.
        // Actually, if it's too old, we shouldn't send it anyway. Let's mark it as requested 
        // if it's older than 24 hours to clean up the queue.
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (booking.completedAt && booking.completedAt < twentyFourHoursAgo) {
           await prisma.booking.update({
             where: { id: booking.id },
             data: { reviewRequested: true }
           });
        }
        continue;
      }

      // Send the WhatsApp template
      // Template Name: 'review_request'
      // Expected Variables: [Customer Name, Google Maps URL]
      const result = await sendWhatsAppTemplate(
        business.metaPhoneNumberId,
        business.metaPermanentToken,
        booking.customerPhone,
        "review_request",
        [booking.customerName, business.googleMapsUrl]
      );

      if (result.success) {
        // Mark as requested
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reviewRequested: true }
        });
        processedCount++;
      } else {
        console.error(`Failed to send review to ${booking.id}: ${result.error}`);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      failed: failedCount,
      totalFound: pendingReviews.length
    });

  } catch (error: any) {
    console.error("Error processing review cron:", error);
    return NextResponse.json({ error: error.message || "Failed to process cron job" }, { status: 500 });
  }
}
