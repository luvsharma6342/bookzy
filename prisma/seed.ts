import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bookzydb?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  await prisma.analyticsEvent.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // ──────────────────────────────────────────────────
  // 🔐  Create demo owner user + account (Better Auth)
  // ──────────────────────────────────────────────────
  console.log('Creating demo owner user...');

  const DEMO_EMAIL = 'owner@bookzy.in';
  const DEMO_PASSWORD = 'demo1234';
  const hashedPw = await hashPassword(DEMO_PASSWORD);
  const now = new Date();

  const demoUser = await prisma.user.create({
    data: {
      id: 'user-demo-owner',
      name: 'Demo Owner',
      email: DEMO_EMAIL,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Better Auth stores the password in the "account" table (credential provider)
  await prisma.account.create({
    data: {
      id: 'acc-demo-owner',
      userId: demoUser.id,
      accountId: demoUser.id,    // for credential provider, accountId = userId
      providerId: 'credential',  // Better Auth's email+password provider name
      password: hashedPw,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`  ✅ Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // ──────────────────────────────────────────────────
  // 🏪  Seed Businesses (linked to demo owner)
  // ──────────────────────────────────────────────────
  console.log('Seeding Businesses...');
  
  const priyasSalon = await prisma.business.create({
    data: {
      id: 'b1',
      ownerId: demoUser.id,
      name: "Priya's Premium Salon",
      slug: 'priyas-salon',
      category: 'Salons & Beauty Parlours',
      phone: '+919876543210',
      city: 'Noida, Sector 18',
      description: 'Transform your look with premium hair styling, facial treatments, and makeups by certified professionals.',
      rating: 4.8,
      reviewsCount: 124,
      plan: 'pro',
      workingHours: {
        monday: { open: '10:00', close: '20:00', closed: false },
        tuesday: { open: '10:00', close: '20:00', closed: false },
        wednesday: { open: '10:00', close: '20:00', closed: false },
        thursday: { open: '10:00', close: '20:00', closed: false },
        friday: { open: '10:00', close: '21:00', closed: false },
        saturday: { open: '09:00', close: '21:00', closed: false },
        sunday: { open: '09:00', close: '21:00', closed: false }
      }
    }
  });

  const flexFitness = await prisma.business.create({
    data: {
      id: 'b2',
      ownerId: demoUser.id,
      name: 'Flex Fitness Club',
      slug: 'flex-fitness',
      category: 'Gyms & Yoga Studios',
      phone: '+919998887776',
      city: 'Indiranagar, Bangalore',
      description: 'Achieve your health goals with state-of-the-art equipment, dynamic group classes, and personal trainer consultations.',
      rating: 4.7,
      reviewsCount: 88,
      plan: 'growth',
      workingHours: {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '07:00', close: '20:00', closed: false },
        sunday: { open: '07:00', close: '13:00', closed: false }
      }
    }
  });

  console.log('Seeding Services...');

  await prisma.service.createMany({
    data: [
      {
        id: 's1',
        businessId: 'b1',
        name: 'Haircut & Blow Dry',
        price: 499,
        duration: 45,
        description: 'Expert styling, wash, blow-dry, and styling tips from senior stylists.',
        category: 'Hair Care',
        active: true
      },
      {
        id: 's2',
        businessId: 'b1',
        name: 'Hydra Facial Treatment',
        price: 1499,
        duration: 60,
        description: 'Deep cleansing, exfoliation, extraction, hydration, and antioxidant protection.',
        category: 'Skincare',
        active: true
      },
      {
        id: 's3',
        businessId: 'b1',
        name: 'Bridal Makeover',
        price: 8999,
        duration: 180,
        description: 'Complete high-definition bridal makeup including hair styling and draping.',
        category: 'Makeup',
        active: true
      },
      {
        id: 's4',
        businessId: 'b1',
        name: 'Keratin Hair Spa',
        price: 1999,
        duration: 90,
        description: 'Keratin smoothing therapy for dry, frizzy, or damaged hair.',
        category: 'Hair Care',
        active: true
      },
      {
        id: 's5',
        businessId: 'b1',
        name: 'Classic Manicure & Pedicure',
        price: 899,
        duration: 60,
        description: 'Nail shaping, cuticle care, scrub, massage, and polish.',
        category: 'Nail Care',
        active: true
      },
      {
        id: 's6',
        businessId: 'b2',
        name: '1-on-1 Personal Training Session',
        price: 799,
        duration: 60,
        description: 'Customized workout routine guided by our certified expert trainers.',
        category: 'Personal Training',
        active: true
      },
      {
        id: 's7',
        businessId: 'b2',
        name: 'Yoga & Pilates Group Class',
        price: 299,
        duration: 60,
        description: 'Mindfulness, flexibility, and core strength development in a group setting.',
        category: 'Group Classes',
        active: true
      }
    ]
  });

  console.log('Seeding Staff...');
  
  await prisma.staff.createMany({
    data: [
      {
        id: 'st1',
        businessId: 'b1',
        name: 'Priya Sharma',
        role: 'Master Stylist / Founder',
        rating: 4.9
      },
      {
        id: 'st2',
        businessId: 'b1',
        name: 'Amit Kumar',
        role: 'Skincare Specialist',
        rating: 4.7
      },
      {
        id: 'st3',
        businessId: 'b2',
        name: 'Coach Vikram',
        role: 'Strength Trainer',
        rating: 4.8
      }
    ]
  });

  console.log('Seeding Bookings...');
  
  const nowTimestamp = new Date();
  
  const tomorrow = new Date(nowTimestamp);
  tomorrow.setDate(nowTimestamp.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const todayEvening = new Date(nowTimestamp);
  todayEvening.setHours(17, 30, 0, 0);

  const yesterday = new Date(nowTimestamp);
  yesterday.setDate(nowTimestamp.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);

  const twoDaysAgo = new Date(nowTimestamp);
  twoDaysAgo.setDate(nowTimestamp.getDate() - 2);
  twoDaysAgo.setHours(16, 0, 0, 0);

  await prisma.booking.createMany({
    data: [
      {
        id: 'bk1',
        businessId: 'b1',
        serviceId: 's1',
        staffId: 'st1',
        customerName: 'Rohan Verma',
        customerPhone: '+919988776655',
        bookingTime: tomorrow,
        price: 499,
        status: 'confirmed',
        bookingSource: 'chatbot',
        notes: 'Needs layer-cut styling',
        createdAt: now
      },
      {
        id: 'bk2',
        businessId: 'b1',
        serviceId: 's2',
        staffId: 'st2',
        customerName: 'Pooja Singh',
        customerPhone: '+918877665544',
        bookingTime: todayEvening,
        price: 1499,
        status: 'pending',
        bookingSource: 'whatsapp_link',
        createdAt: now
      },
      {
        id: 'bk3',
        businessId: 'b1',
        serviceId: 's4',
        staffId: 'st1',
        customerName: 'Kirti Sen',
        customerPhone: '+917766554433',
        bookingTime: yesterday,
        price: 1999,
        status: 'completed',
        bookingSource: 'chatbot',
        createdAt: yesterday
      },
      {
        id: 'bk4',
        businessId: 'b1',
        serviceId: 's1',
        staffId: 'st1',
        customerName: 'Harsh Patel',
        customerPhone: '+919654321098',
        bookingTime: twoDaysAgo,
        price: 499,
        status: 'no_show',
        bookingSource: 'whatsapp_link',
        createdAt: twoDaysAgo
      }
    ]
  });

  console.log('Seeding Analytics...');
  
  const analyticsData: any[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(nowTimestamp);
    date.setDate(nowTimestamp.getDate() - i);
    
    // Priya's salon views (e.g. between 10 and 25 views per day)
    const viewsCount = Math.floor(Math.random() * 15) + 10;
    for (let v = 0; v < viewsCount; v++) {
      analyticsData.push({
        id: `ev-view-${i}-${v}`,
        businessId: 'b1',
        eventType: 'page_view',
        timestamp: new Date(date.getTime() - Math.random() * 36000000)
      });
    }

    // Book now clicks (e.g. between 3 and 10 per day)
    const clicksCount = Math.floor(Math.random() * 7) + 3;
    for (let c = 0; c < clicksCount; c++) {
      analyticsData.push({
        id: `ev-click-${i}-${c}`,
        businessId: 'b1',
        eventType: 'book_now_click',
        timestamp: new Date(date.getTime() - Math.random() * 36000000)
      });
    }
  }

  await prisma.analyticsEvent.createMany({
    data: analyticsData
  });

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
