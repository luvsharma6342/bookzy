import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheDel, cacheKeys } from "@/lib/redis";
import { cleanWhatsAppPhone } from "@/lib/whatsapp";

// GET: Verification handshake for Meta Webhook
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const localVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "bookze_whatsapp_2024";

    if (mode === "subscribe" && token === localVerifyToken) {
      console.log("Meta Webhook verified successfully.");
      // Return the challenge back as raw text (Meta expects this)
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    console.warn("Meta Webhook verification failed. Tokens do not match.");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    console.error("Error in webhook verification GET:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Receives real-time updates from Meta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming Webhook payload:", JSON.stringify(body));

    // Meta webhook must always get 200 OK immediately, else they retry and disable
    const okResponse = NextResponse.json({ received: true }, { status: 200 });

    const changes = body?.entry?.[0]?.changes?.[0]?.value;
    if (!changes || !changes.messages || changes.messages.length === 0) {
      return okResponse;
    }

    const message = changes.messages[0];
    const customerPhone = message.from; // Customer phone (e.g. 919988776655)
    const textBody = message.text?.body?.trim();
    const phoneNumberId = changes.metadata?.phone_number_id; // WABA phone number ID

    if (!customerPhone || !textBody || !phoneNumberId) {
      return okResponse;
    }

    console.log(`Received WhatsApp message from ${customerPhone} to WABA phone ID ${phoneNumberId}: "${textBody}"`);

    // Lookup business associated with this phone number ID
    const business = await prisma.business.findFirst({
      where: { metaPhoneNumberId: phoneNumberId }
    });

    if (!business) {
      console.warn(`No business found matching metaPhoneNumberId: ${phoneNumberId}`);
      return okResponse;
    }

    const cleanIncoming = cleanWhatsAppPhone(customerPhone);
    const lowercaseText = textBody.toLowerCase();

    // Handle cancel request
    if (lowercaseText === "cancel") {
      console.log(`Attempting to cancel active bookings for phone: ${cleanIncoming} at Business: ${business.name} (${business.id})`);

      // Find pending/confirmed bookings for this business
      const activeBookings = await prisma.booking.findMany({
        where: {
          businessId: business.id,
          status: { in: ["pending", "confirmed"] }
        }
      });

      // Match by cleaning phone numbers
      const matchedBooking = activeBookings.find(bk => {
        return cleanWhatsAppPhone(bk.customerPhone) === cleanIncoming;
      });

      if (matchedBooking) {
        // Update status to cancelled
        await prisma.booking.update({
          where: { id: matchedBooking.id },
          data: { status: "cancelled" }
        });

        // Invalidate cache
        await cacheDel(cacheKeys.bookings(business.id));

        console.log(`Successfully cancelled booking ${matchedBooking.id} for customer ${customerPhone}`);

        // Try to reply with confirmation text
        if (business.metaPermanentToken) {
          try {
            await fetch(
              `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${business.metaPermanentToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: cleanIncoming,
                  type: "text",
                  text: {
                    body: `Your appointment for ${business.name} has been cancelled successfully.`
                  }
                })
              }
            );
          } catch (replyErr) {
            console.error("Failed to send WhatsApp cancel confirmation reply:", replyErr);
          }
        }
      } else {
        console.log(`No active booking found for phone ${cleanIncoming} at business ${business.id}`);
        // Reply saying no active booking found
        if (business.metaPermanentToken) {
          try {
            await fetch(
              `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${business.metaPermanentToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: cleanIncoming,
                  type: "text",
                  text: {
                    body: `We couldn't find an active appointment for your phone number at ${business.name}.`
                  }
                })
              }
            );
          } catch (replyErr) {
            console.error("Failed to send WhatsApp reply:", replyErr);
          }
        }
      }
    } else if (lowercaseText === "yes") {
      console.log(`Customer ${customerPhone} responded YES to follow-up.`);
      // Reply to customer acknowledging their message
      if (business.metaPermanentToken) {
        try {
          await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${business.metaPermanentToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanIncoming,
                type: "text",
                text: {
                  body: `Thank you for your response! We will reach out shortly to find you a new slot.`
                }
              })
            }
          );
        } catch (replyErr) {
          console.error("Failed to send WhatsApp reply:", replyErr);
        }
      }
    }

    return okResponse;
  } catch (error: any) {
    console.error("Error in webhook endpoint POST:", error);
    // Still return 200 so Meta doesn't disable our webhook
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
