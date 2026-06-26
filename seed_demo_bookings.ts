import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bookzydb?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding demo bookings for all businesses...');
  
  const businesses = await prisma.business.findMany();
  if (businesses.length === 0) {
    console.error('No businesses found.');
    return;
  }

  for (const business of businesses) {
    console.log(`\n--- Seeding for ${business.name} ---`);
    let service = await prisma.service.findFirst({ where: { businessId: business.id } });
    if (!service) {
      service = await prisma.service.create({
        data: {
          businessId: business.id,
          name: 'Demo Service',
          duration: 30,
          price: 500,
          description: 'A service for demo bookings',
          category: 'General'
        }
      });
    }

    const staff = await prisma.staff.findFirst({ where: { businessId: business.id } });

    const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    const sources = ['whatsapp_link', 'chatbot', 'manual'];
    const firstNames = ['Amit', 'Rahul', 'Priya', 'Sneha', 'Vikram', 'Anjali', 'Karan', 'Neha', 'Rohan', 'Pooja', 'Suresh', 'Anita'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Joshi', 'Mishra'];

    let createdCount = 0;
    
    for (let i = 0; i < 200; i++) {
      const randomDays = Math.floor(Math.random() * 60) - 30;
      const randomHours = Math.floor(Math.random() * 10) + 9;
      
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + randomDays);
      bookingDate.setHours(randomHours, Math.floor(Math.random() * 4) * 15, 0, 0);

      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const phone = `+919${Math.floor(Math.random() * 900000000 + 100000000)}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const price = service.price || 500;

      await prisma.booking.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          staffId: staff ? staff.id : null,
          customerName: name,
          customerPhone: phone,
          bookingTime: bookingDate,
          price: price,
          status: status,
          bookingSource: source,
          createdAt: new Date(bookingDate.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        }
      });
      
      createdCount++;
      if (createdCount % 50 === 0) {
        console.log(`Created ${createdCount} bookings...`);
      }
    }
    console.log(`✅ Successfully seeded ${createdCount} bookings for business: ${business.name}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
