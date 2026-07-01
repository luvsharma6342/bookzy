import { NextRequest } from "next/server";
import { GET } from "./src/app/api/cron/whatsapp-reminders/route";
import prisma from "./src/lib/prisma";

async function main() {
  console.log("Creating a test booking for tomorrow...");
  
  const business = await prisma.business.findFirst();
  if (!business) {
    console.error("No business found");
    return;
  }
  
  const service = await prisma.service.findFirst({ where: { businessId: business.id } });
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow
  
  const booking = await prisma.booking.create({
    data: {
      businessId: business.id,
      serviceId: service?.id || "unknown",
      customerName: "Cron Test User",
      customerPhone: "+919876543210",
      bookingTime: tomorrow,
      price: 500,
      status: "confirmed",
      bookingSource: "manual",
      reminderSent: false
    }
  });
  console.log(`Created test booking: ${booking.id}`);
  
  console.log("\nTriggering Cron API...");
  const req = new NextRequest("http://localhost:3000/api/cron/whatsapp-reminders", {
    headers: {
      "authorization": `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  const res = await GET(req);
  const data = await res.json();
  console.log("Cron API Response:");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("\nChecking database for reminderSent status...");
  const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
  console.log(`Booking reminderSent: ${updatedBooking?.reminderSent}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
