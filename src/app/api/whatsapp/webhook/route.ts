import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel, cacheKeys } from "@/lib/redis";
import { cleanWhatsAppPhone } from "@/lib/whatsapp";
import { getEffectivePlan } from "@/lib/planOverride";

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
    } else {
      // AI Chatbot logic for Pro plans
      const effectivePlan = getEffectivePlan(business.plan);
      if (effectivePlan === "pro" && business.metaPermanentToken) {
        await handleAIChatbotSession(business, phoneNumberId, cleanIncoming, textBody);
      }
    }

    return okResponse;
  } catch (error: any) {
    console.error("Error in webhook endpoint POST:", error);
    // Still return 200 so Meta doesn't disable our webhook
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

async function handleAIChatbotSession(
  business: any,
  phoneNumberId: string,
  customerPhone: string,
  userMessage: string
) {
  const businessId = business.id;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("your_gemini")) {
    console.warn("GEMINI_API_KEY is not configured. AI Chatbot will not execute.");
    return;
  }

  // 1. Retrieve message history from Redis cache
  const chatHistoryKey = `chat:history:${businessId}:${customerPhone}`;
  let history = await cacheGet<any[]>(chatHistoryKey);
  if (!history || !Array.isArray(history)) {
    history = [];
  }

  // 2. Fetch business data for context
  const [services, staffList, blockedDates, upcomingBookings] = await Promise.all([
    prisma.service.findMany({ where: { businessId, active: true } }),
    prisma.staff.findMany({ where: { businessId } }),
    prisma.blockedDate.findMany({ where: { businessId } }),
    prisma.booking.findMany({
      where: {
        businessId,
        bookingTime: { gte: new Date() },
        status: { in: ["pending", "confirmed"] }
      },
      orderBy: { bookingTime: "asc" },
      take: 50 // Limit context size
    })
  ]);

  // Format existing bookings details for Gemini context
  const formattedBookings = upcomingBookings.map(b => {
    const bookingTimeObj = new Date(b.bookingTime);
    const timeStr = bookingTimeObj.toISOString();
    return `- Staff ID: ${b.staffId || "Any"}, Time: ${timeStr}, Status: ${b.status}`;
  }).join("\n");

  const formattedServices = services.map(s => {
    return `- ID: ${s.id}, Name: "${s.name}", Price: ₹${s.price}, Duration: ${s.duration} mins, Description: "${s.description}", Category: "${s.category}"`;
  }).join("\n");

  const formattedStaff = staffList.map(st => {
    return `- ID: ${st.id}, Name: "${st.name}", Role: "${st.role}", Rating: ${st.rating}`;
  }).join("\n");

  const formattedBlocked = blockedDates.map(bd => `- ${bd.date}${bd.reason ? ` (Reason: ${bd.reason})` : ""}`).join("\n");

  // Get current date time in business's timezone or local ISO/formatted form
  const now = new Date();
  const currentDateTimeStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const systemPrompt = `You are a friendly, professional AI booking assistant representing "${business.name}" (a ${business.category} business in ${business.city}).
Your task is to converse with a customer on WhatsApp to answer their queries, check available slots, cancel bookings, or schedule new appointments.

Business Details:
- Name: ${business.name}
- Category: ${business.category}
- Description: ${business.description || "N/A"}
- City: ${business.city}

Working Hours:
${JSON.stringify(business.workingHours, null, 2)}

Holidays/Blocked Dates:
${formattedBlocked || "None"}

Available Services (Customers can select from these):
${formattedServices}

Available Staff Members (Optional, customers can book with a specific staff or select "Any Staff"):
${formattedStaff}

Existing Bookings (These slots are already taken. Do NOT book a slot that overlaps with these):
${formattedBookings || "None"}

Current Time: ${currentDateTimeStr} (Use this to parse relative times like "tomorrow" or "Friday 10am")

Instructions for Conversing:
1. Greet the customer and help them select a service, date, time, and optional staff.
2. Keep responses brief and friendly (fits well on WhatsApp).
3. If they ask about prices, options, or details, answer accurately using the data provided.
4. Verify the slot they ask for is within working hours, is not a holiday/blocked date, and does not overlap with existing bookings for their selected staff.
5. If they confirm they want to book a valid slot:
   - Generate a JSON confirmation block at the end of your response.
   - You MUST structure it EXACTLY as follows:
   \`\`\`json
   {
     "action": "CREATE_BOOKING",
     "serviceId": "SERVICE_ID_HERE",
     "staffId": "STAFF_ID_HERE" (or null if "Any Staff"),
     "bookingTime": "YYYY-MM-DDTHH:mm:00.000Z" (ISO string in UTC for the requested slot start time),
     "customerName": "CUSTOMER_NAME_HERE" (infer their name or ask for it)
   }
   \`\`\`
   Do not explain the JSON block, just output it at the very end of your response text.
`;

  // 3. Format history for Gemini API
  // Gemini expects history in this format: [{ role: "user" | "model", parts: [{ text: "..." }] }]
  const contents = [...history, { role: "user", parts: [{ text: userMessage }] }];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.3
          }
        })
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`Gemini API returned status ${response.status}:`, errBody);
      return;
    }

    const resJson = await response.json();
    let replyText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!replyText) {
      console.warn("Gemini returned empty text response");
      return;
    }

    console.log("Gemini raw reply:", replyText);

    // 4. Parse response for action block
    const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = replyText.match(jsonRegex);

    if (match) {
      try {
        const actionData = JSON.parse(match[1]);
        if (actionData.action === "CREATE_BOOKING") {
          const { serviceId, staffId, bookingTime, customerName } = actionData;

          // Double check service details
          const service = services.find(s => s.id === serviceId);
          if (service) {
            // Check double booking overlap
            const reqStart = new Date(bookingTime);
            const reqEnd = new Date(reqStart.getTime() + service.duration * 60 * 1000);
            
            // Query bookings overlapping in DB
            const checkStart = new Date(reqStart.getTime() - 12 * 60 * 60 * 1000);
            const checkEnd = new Date(reqStart.getTime() + 12 * 60 * 60 * 1000);

            const overlaps = await prisma.booking.findMany({
              where: {
                businessId,
                staffId: staffId || null,
                status: { in: ["confirmed", "pending"] },
                bookingTime: { gte: checkStart, lte: checkEnd }
              },
              include: { service: true }
            });

            let isOverlap = false;
            if (staffId) {
              for (const bk of overlaps) {
                const bkStart = new Date(bk.bookingTime);
                const bkEnd = new Date(bkStart.getTime() + bk.service.duration * 60 * 1000);
                if (bkStart < reqEnd && bkEnd > reqStart) {
                  isOverlap = true;
                  break;
                }
              }
            }

            if (isOverlap) {
              replyText = "I apologize, but that slot was just booked by another customer. Please select another time.";
            } else {
              // Create the booking!
              await prisma.booking.create({
                data: {
                  businessId,
                  serviceId,
                  staffId: staffId || null,
                  customerName,
                  customerPhone,
                  bookingTime: reqStart,
                  price: service.price,
                  status: "pending", // Default to pending
                  bookingSource: "chatbot",
                  notes: "Booked automatically by WhatsApp AI Assistant."
                }
              });

              // Create booking_created analytics event
              await prisma.analyticsEvent.create({
                data: { businessId, eventType: "booking_created", timestamp: new Date() }
              });

              // Invalidate bookings cache
              await cacheDel(cacheKeys.bookings(businessId));
            }
          }
        }
      } catch (jsonErr) {
        console.error("Failed to parse action JSON from Gemini reply:", jsonErr);
      }
    }

    // Clean text: strip the JSON action code block before sending text message to user
    const userReply = replyText.replace(/```json[\s\S]*?```/g, "").trim();

    // 5. Send message back to user via Meta WhatsApp API
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
          to: customerPhone,
          type: "text",
          text: {
            body: userReply
          }
        })
      }
    );

    // 6. Update Redis Chat History (save user message & cleaned bot response)
    const updatedHistory = [
      ...contents,
      {
        role: "model",
        parts: [{ text: replyText }] // Keep action block in history so Gemini knows it booked it
      }
    ];

    // Keep history trimmed to last 20 messages for prompt size controls
    if (updatedHistory.length > 20) {
      updatedHistory.splice(0, updatedHistory.length - 20);
    }

    await cacheSet(chatHistoryKey, updatedHistory, 7200); // 2 hour expiration
  } catch (err) {
    console.error("Error running AI chatbot session:", err);
  }
}
