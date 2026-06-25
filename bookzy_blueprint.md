# Bookzy Application Blueprint: WhatsApp & Google Calendar Booking SaaS

This document is a comprehensive, production-grade blueprint for building **Bookzy**—a local services appointment scheduling SaaS platform. It combines self-serve online scheduling, a WhatsApp chat simulator, and real-time bi-directional Google Calendar sync.

If you give this document to **Antigravity**, it contains all the architecture, schema definitions, endpoint structures, and logic details required to recreate this application from scratch.

---

## 1. Tech Stack & Dependencies

### Core Stack
*   **Framework**: Next.js (App Router, React 19 / Next 16)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Authentication**: Better Auth (Email/Password & Google OAuth)
*   **Styling**: TailwindCSS & Vanilla CSS (for theme-based storefronts)
*   **Caching**: Redis (Cache-aside strategy for high-traffic storefronts)
*   **Libraries**:
    *   `googleapis` (Google Calendar Integration)
    *   `lucide-react` (Icons)
    *   `canvas-confetti` (Celebration micro-animations)
    *   `framer-motion` (Page transitions & modal animations)

### Dependencies config (`package.json`)
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "better-auth": "^1.0.0",
    "canvas-confetti": "^1.6.0",
    "framer-motion": "^11.0.0",
    "googleapis": "^126.0.0",
    "lucide-react": "^0.300.0",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 2. Directory Structure

```text
├── prisma/
│   └── schema.prisma                # Database Models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/           # GET analytics events metrics
│   │   │   ├── bookings/
│   │   │   │   ├── availability/    # Dynamic free/busy endpoint (overlaps Bookzy & Google API)
│   │   │   │   └── route.ts         # Create & cancel bookings (triggers Google Event Sync)
│   │   │   ├── businesses/          # CRUD Business Details
│   │   │   ├── services/            # CRUD Service Catalogue
│   │   │   ├── staff/
│   │   │   │   ├── google-auth/     # Step 1: Initiate staff Google OAuth redirection
│   │   │   │   ├── google-callback/ # Step 2: Handle Google auth code exchange and save tokens
│   │   │   │   └── route.ts         # CRUD Staff members
│   │   │   └── auth/                # Better Auth hooks
│   │   ├── auth/
│   │   │   ├── onboard/             # Create initial business settings upon registration
│   │   │   └── page.tsx             # Login / Register interface (Better Auth client integration)
│   │   ├── book/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx         # Storefront page (Server Component, fetches with cache-aside)
│   │   │       └── StorefrontClient.tsx # Interactive storefront UI wizard
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Admin console for Business Owners
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Platform Landing Page
│   ├── components/
│   │   └── ChatbotSimulator.tsx     # Simulated WhatsApp chat overlay for Pro plan bookings
│   ├── lib/
│   │   ├── auth-client.ts           # Better Auth client configuration
│   │   ├── auth.ts                  # Better Auth server configuration
│   │   ├── db.ts                    # Local mock fallback models (optional dev fallback)
│   │   ├── formatter.ts             # Rich text text-to-HTML parser (handles markdown descriptions)
│   │   ├── googleCalendar.ts        # OAuth URL gen, Token Refresh, Event Sync, FreeBusy Query
│   │   ├── prisma.ts                # Prisma Client Singleton
│   │   └── redis.ts                 # Caching client, keys schema, Cache-aside wrapper
```

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  businesses    Business[]

  @@map("user")
}

model Business {
  id                       String           @id @default(uuid())
  ownerId                  String?
  owner                    User?            @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  name                     String
  slug                     String           @unique
  category                 String
  phone                    String           # WhatsApp business number
  description              String
  city                     String
  workingHours             Json             # Format: { monday: { open: "10:00", close: "20:00", closed: false }, ... }
  plan                     String           @default("free") # "free" | "growth" | "pro"
  planStatus               String           @default("active")
  
  services     Service[]
  staff        Staff[]
  bookings     Booking[]
  analytics    AnalyticsEvent[]
  blockedDates BlockedDate[]

  @@map("business")
}

model Service {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  price       Float
  duration    Int       # in minutes
  description String
  category    String
  active      Boolean   @default(true)
  
  bookings    Booking[]
  staff       Staff[]

  @@map("service")
}

model Staff {
  id          String    @id @default(uuid())
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  role        String
  rating      Float     @default(5.0)
  
  bookings    Booking[]
  services    Service[]
  googleSync  StaffGoogleSync?

  @@map("staff")
}

model StaffGoogleSync {
  id                    String   @id @default(uuid())
  staffId               String   @unique
  staff                 Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)
  accessToken           String
  refreshToken          String
  expiryDate            BigInt   # Milliseconds timestamp
  calendarId            String?  @default("primary")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("staff_google_sync")
}

model Booking {
  id            String    @id @default(uuid())
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  serviceId     String
  service       Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  staffId       String?
  staff         Staff?    @relation(fields: [staffId], references: [id], onDelete: SetNull)
  customerName  String
  customerPhone String
  bookingTime   DateTime
  price         Float
  status        String    @default("pending") # "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  bookingSource String    @default("whatsapp_link") # "whatsapp_link" | "chatbot" | "manual"
  notes         String?
  googleEventId String?   # Stored reference to the calendar event
  createdAt     DateTime  @default(now())

  @@map("booking")
}

model AnalyticsEvent {
  id         String   @id @default(uuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  eventType  String   # "page_view" | "book_now_click" | "booking_created"
  timestamp  DateTime @default(now())

  @@map("analytics_event")
}

model BlockedDate {
  id         String   @id @default(uuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  date       String   # "YYYY-MM-DD"
  reason     String?
  createdAt  DateTime @default(now())

  @@unique([businessId, date])
  @@map("blocked_date")
}
```

---

## 4. Backend Utilities

### A. Google Calendar Integration Helper (`src/lib/googleCalendar.ts`)
Creates an OAuth2 client, generates credentials, handles token expiration checks on demand, and pushes changes.

```typescript
import { google } from 'googleapis';
import prisma from './prisma';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getGoogleAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );
}

// Generates the staff-specific authorization link
export function getAuthUrl(staffId: string) {
  const oauth2Client = getGoogleAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: staffId,
  });
}

// Exchange callback code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getGoogleAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Returns authenticated client, auto-refreshing expired tokens
export async function getAuthenticatedClientForStaff(staffId: string) {
  const syncRecord = await prisma.staffGoogleSync.findUnique({
    where: { staffId },
  });
  if (!syncRecord) return null;

  const oauth2Client = getGoogleAuthClient();
  oauth2Client.setCredentials({
    access_token: syncRecord.accessToken,
    refresh_token: syncRecord.refreshToken,
    expiry_date: Number(syncRecord.expiryDate),
  });

  const now = Date.now();
  if (syncRecord.expiryDate && Number(syncRecord.expiryDate) <= now + 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.staffGoogleSync.update({
        where: { id: syncRecord.id },
        data: {
          accessToken: credentials.access_token as string,
          expiryDate: credentials.expiry_date ? BigInt(credentials.expiry_date) : syncRecord.expiryDate,
        },
      });
    } catch (err) {
      console.error('Failed to refresh Google token for staff:', staffId, err);
      return null;
    }
  }

  return oauth2Client;
}

// Create Event
export async function createCalendarEvent(staffId: string, eventDetails: any) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventDetails,
  });
  return response.data;
}

// Delete Event
export async function deleteCalendarEvent(staffId: string, eventId: string) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
  return true;
}

// Query Google Free/Busy API
export async function getFreeBusy(staffId: string, timeMin: Date, timeMax: Date) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return [];

  const calendar = google.calendar({ version: 'v3', auth });
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: 'primary' }],
      },
    });
    return response.data.calendars?.['primary']?.busy || [];
  } catch (error) {
    console.error('Error fetching Free/Busy:', error);
    return [];
  }
}
```

### B. Caching Layer (`src/lib/redis.ts`)
Implements high-performance cache-aside caching wrapper for high-volume customer storefront pages.

```typescript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis Client Error', err));
if (!client.isOpen) {
  client.connect().catch(() => {});
}

export const cacheKeys = {
  businessBySlug: (slug: string) => `biz:slug:${slug}`,
  businessById: (id: string) => `biz:id:${id}`,
  services: (businessId: string) => `biz:${businessId}:services`,
  staff: (businessId: string) => `biz:${businessId}:staff`,
  bookings: (businessId: string) => `biz:${businessId}:bookings`,
  blockedDates: (businessId: string) => `biz:${businessId}:blocked`,
};

export const TTL = {
  STOREFRONT: 3600, // 1 hour
  BOOKINGS: 300,    // 5 minutes
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {}
}

export async function cacheDel(key: string) {
  try {
    await client.del(key);
  } catch {}
}
```

---

## 5. Key API Endpoints

### A. Dynamic Availability API (`src/app/api/bookings/availability/route.ts`)
Calculates the dynamic available time slots for the customer interface by checking overlaps between Bookzy database bookings AND external Google Calendar busy blocks.

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFreeBusy } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const dateStr = searchParams.get("date"); // Format: YYYY-MM-DD
  const staffId = searchParams.get("staffId"); // Optional staff filter

  if (!businessId || !dateStr) {
    return NextResponse.json({ error: "Required params missing" }, { status: 400 });
  }

  try {
    const noon = new Date(`${dateStr}T12:00:00.000Z`);
    const checkStart = new Date(noon.getTime() - 14 * 60 * 60 * 1000);
    const checkEnd = new Date(noon.getTime() + 14 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: {
        businessId,
        bookingTime: { gte: checkStart, lte: checkEnd },
        status: { in: ["confirmed", "pending"] },
        ...(staffId ? { staffId } : {}),
      },
      include: { service: true }
    });

    let googleBusyBlocks: any[] = [];

    if (staffId) {
      const blocks = await getFreeBusy(staffId, checkStart, checkEnd);
      googleBusyBlocks = blocks.map((b: any) => ({ ...b, staffId }));
    } else {
      // Find all staff who have Google Sync connected
      const connectedStaff = await prisma.staff.findMany({
        where: { businessId },
        include: { googleSync: true }
      });
      const syncPromises = connectedStaff
        .filter(s => s.googleSync)
        .map(async (s) => {
          const blocks = await getFreeBusy(s.id, checkStart, checkEnd);
          return blocks.map((b: any) => ({ ...b, staffId: s.id }));
        });
      const results = await Promise.all(syncPromises);
      googleBusyBlocks = results.flat();
    }

    return NextResponse.json({ bookings, googleBusyBlocks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
```

### B. OAuth Integration Routes
#### Initiate Redirection (`src/app/api/staff/google-auth/route.ts`)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!staffId) return NextResponse.json({ error: "Staff ID required" }, { status: 400 });

  const authUrl = getAuthUrl(staffId);
  return NextResponse.redirect(authUrl);
}
```

#### Handle Callback (`src/app/api/staff/google-callback/route.ts`)
Exchanges credentials code for token and updates the database, using standard ES2017 compliant `BigInt` methods.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/googleCalendar";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const staffId = req.nextUrl.searchParams.get("state"); // passes staff ID

  if (!code || !staffId) return NextResponse.json({ error: "Code/State missing" }, { status: 400 });

  try {
    const tokens = await getTokensFromCode(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: "No refresh token returned" }, { status: 400 });
    }

    await prisma.staffGoogleSync.upsert({
      where: { staffId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : BigInt(0),
      },
      create: {
        staffId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : BigInt(0),
        calendarId: "primary",
      },
    });

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 3rem;">
          <h1 style="color:#10b981">Success!</h1>
          <p>Your calendar has been securely connected. You may close this window.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to exchange authorization tokens" }, { status: 500 });
  }
}
```

### C. Booking CRUD Operations (`src/app/api/bookings/route.ts`)
*   **POST**: Creates the database booking. If the staff member is connected to Google, uses `googleCalendar.createCalendarEvent` to place an event in their calendar and saves the returned event ID to the `Booking` record.
*   **PUT**: Used by the owner dashboard. If a booking's status changes to `cancelled` or `no_show`, calls `googleCalendar.deleteCalendarEvent` using the stored event ID to wipe the slot from Google.

---

## 6. Frontend Core Components

### A. Storefront Booking Wizard (`src/app/book/[slug]/StorefrontClient.tsx`)
A highly responsive multi-step booking client.

#### Key Types & State
```typescript
interface StorefrontBooking extends Booking {
  service?: Service;
}
```

#### Overlap Check Logic:
Determines if a candidate `timeSlot` (e.g. "11:30 AM") is blocked.
```typescript
const isSlotBooked = (timeSlot: string) => {
  if (!selectedDate) return false;
  
  const [hoursStr, minutesPart] = timeSlot.split(':');
  let hrs = parseInt(hoursStr);
  const mins = parseInt(minutesPart.substring(0, 2));
  if (timeSlot.toLowerCase().includes('pm') && hrs < 12) hrs += 12;
  if (timeSlot.toLowerCase().includes('am') && hrs === 12) hrs = 0;
  
  const slotStart = new Date(selectedDate);
  slotStart.setHours(hrs, mins, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + (selectedService?.duration || 30) * 60000);

  // 1. Check local Bookzy database bookings
  const isBookzyBooked = bookings.some((b) => {
    const bTime = new Date(b.bookingTime);
    const bEnd = new Date(bTime.getTime() + (b.service?.duration || 30) * 60000);
    return (slotStart < bEnd && slotEnd > bTime);
  });
  if (isBookzyBooked) return true;

  // 2. Check Google busy periods
  const isGoogleBusy = googleBusyBlocks.some((block) => {
    const blockStart = new Date(block.start);
    const blockEnd = new Date(block.end);
    
    if (!selectedStaff) {
       // If searching for "Any Staff", only block the slot if ALL available staff are busy
       const busyStaffIds = new Set(googleBusyBlocks.filter(b => {
           const bS = new Date(b.start);
           const bE = new Date(b.end);
           return slotStart < bE && slotEnd > bS;
       }).map(b => b.staffId));
       
       const bookzyBusyStaffIds = new Set(bookings.filter(b => {
           const bT = new Date(b.bookingTime);
           const bE = new Date(bT.getTime() + (b.service?.duration || 30) * 60000);
           return slotStart < bE && slotEnd > bT;
       }).map(b => b.staffId));
       
       const totalBusyStaff = new Set([...busyStaffIds, ...bookzyBusyStaffIds]);
       return totalBusyStaff.size >= availableStaff.length;
    }

    return (slotStart < blockEnd && slotEnd > blockStart);
  });

  return isGoogleBusy;
};
```

### B. Pro Booking Chatbot Simulator (`src/components/ChatbotSimulator.tsx`)
A simulated WhatsApp chat interface. It acts as an automated interactive agent that guides the user step-by-step through choosing a service, selecting a date and slot, providing customer details, creating a database record via `/api/bookings` POST, and triggering confetti on confirmation.

---

## 7. Environment Variables Required (`.env.example`)

```env
# Database configuration
DATABASE_URL="postgresql://username:password@localhost:5432/bookzydb?schema=public"

# Redis caching
REDIS_URL="redis://localhost:6379"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your_highly_secure_better_auth_secret_string"
BETTER_AUTH_URL="http://localhost:3000"

# Google Gemini API key (for intelligent chatbot simulation)
GEMINI_API_KEY="your_google_gemini_api_key"

# Google Calendar Integration (OAuth Web Client credentials from Google Developer Console)
GOOGLE_CALENDAR_CLIENT_ID="your_google_calendar_client_id.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="your_google_calendar_client_secret"
GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:3000/api/staff/google-callback"
```
