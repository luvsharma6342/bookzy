# Bookzy Project Roadmap: Features to Add

This document outlines the priority roadmap for the features to be added to the Bookzy booking SaaS application.

## 🚀 Priority 0: High-Impact Core Product Value (Highest Priority)

### 1. Storefront Booking Payments (Razorpay Integration)
* **Description**: Allow businesses to collect online payments (full pre-payment or partial booking deposit) from customers during the storefront booking wizard.
* **Why**: Reduces customer no-shows dramatically and secures upfront revenue for merchants.
* **Implementation Plan**:
  * Add `paymentRequired` (Boolean, default: `false`) and `depositAmount` (Float, optional) fields to the `Service` model in [schema.prisma](file:///e:/Freelance%20projects/bookzy/prisma/schema.prisma).
  * Expose these fields in the dashboard Services list and editing wizard in [page.tsx](file:///e:/Freelance%20projects/bookzy/src/app/dashboard/page.tsx).
  * Load the Razorpay SDK on the client booking storefront ([StorefrontClient.tsx](file:///e:/Freelance%20projects/bookzy/src/app/book/%5Bslug%5D/StorefrontClient.tsx)). If a service requires payment, trigger the Razorpay checkout modal before creating the booking.
  * On payment success, call `/api/bookings` with the `razorpay_payment_id` to create the booking with a status of `confirmed` instead of `pending`.

### 2. Fully Functional AI WhatsApp Booking Agent (Pro Plan Upgrade)
* **Description**: Implement a conversational booking assistant using the Gemini API to converse with customers on WhatsApp, answer queries, verify slot availability, and handle bookings.
* **Why**: The current "Pro Chatbot" is only a frontend mockup simulator ([ChatbotSimulator.tsx](file:///e:/Freelance%20projects/bookzy/src/components/ChatbotSimulator.tsx)). Real-world customers expect automated interaction directly on WhatsApp.
* **Implementation Plan**:
  * Modify the WhatsApp webhook handler ([route.ts](file:///e:/Freelance%20projects/bookzy/src/app/api/whatsapp/webhook/route.ts)) to forward user messages to Gemini API.
  * System prompt Gemini with business metadata, service lists, working hours, and current bookings context.
  * Gemini extracts booking intent, checks slot availability, calls booking creation, and replies to the customer using Meta Cloud API ([whatsapp.ts](file:///e:/Freelance%20projects/bookzy/src/lib/whatsapp.ts)).

---

## 📅 Priority 1: Operational Integrity & Scheduling (High Priority)

### 3. Bi-directional Google Calendar Sync for Staff & Business
* **Description**: Automatically push Bookzy bookings to staff Google/Apple Calendars, and block out slot times on the storefront when staff members are busy in their personal calendar.
* **Why**: Prevents schedule fragmentation and double-bookings.
* **Implementation Plan**:
  * Establish Google OAuth2 configuration and save Google credentials in a new `StaffGoogleSync` table.
  * When a booking is created or updated in Bookzy, trigger a calendar write operation using Google Calendar API.
  * In the storefront slot generator, query the Google Calendar Free/Busy API to filter out occupied periods.

### 4. Multi-Service Cart Checkout
* **Description**: Enable booking multiple services in a single storefront checkout transaction (e.g. hair wash + styling + shave).
* **Why**: Increases the average transaction value and aligns with real-world customer behavior in salons, spas, and auto garages.
* **Implementation Plan**:
  * Redesign [StorefrontClient.tsx](file:///e:/Freelance%20projects/bookzy/src/app/book/%5Bslug%5D/StorefrontClient.tsx) to support a cart of selected services.
  * Adjust slot picker to only display start times that have contiguous free time equal to the combined service duration.
  * Update database schema/routes to support multiple service IDs linked to a single checkout/booking.

---

## 📊 Priority 2: Customer Relationships & CRM (Medium Priority)

### 5. Unified Customer CRM & Target WhatsApp Marketing
* **Description**: Create a dedicated CRM tab in the dashboard grouping bookings by phone number/name, showing customer lifetime value (LTV), visit frequency, and allowing segmented WhatsApp promotion broadcasts.
* **Why**: Helps merchants re-engage inactive customers and drive repeat visits.
* **Implementation Plan**:
  * Add a "Customers" view to the dashboard.
  * Group booking details by phone number, displaying client profiles, notes, preferences, and statistics.
  * Provide a broadcasting interface to select custom templates and dispatch WhatsApp marketing blasts to targeted segments via Meta Cloud API.

### 6. Interactive Drag-and-Drop Calendar Schedule Grid
* **Description**: Provide a weekly/daily calendar schedule grid (staff as columns, hours as rows) where merchants can manage appointments.
* **Why**: Offers a vastly superior visual representation of current bookings compared to list tables.
* **Implementation Plan**:
  * Integrate a scheduling calendar library (e.g. FullCalendar React or custom CSS scheduling grid) in the dashboard.
  * Add drag-and-drop handlers to reschedule bookings or change staff assignments via `PUT /api/bookings`.

---

## 📈 Priority 3: Growth Loops & Feedback (Low Priority)

### 7. Native Reviews & Referral Engine
* **Description**: Collect client feedback directly through Bookzy post-appointment and display reviews on the business storefront. Also, introduce a customer referral coupon system.
* **Why**: Builds direct social proof and incentivizes organic user acquisition.
* **Implementation Plan**:
  * Create a `Review` database model.
  * Trigger automated post-visit WhatsApp messages requesting feedback with custom review links.
  * Display average ratings and recent reviews on the storefront page.

## 📈 Priority 3: Growth & Customer Acquisition (New Roadmap)

### 7. Automated Review Generation
* **Description**: Automatically send a WhatsApp message asking for a Google Maps review 2 hours after the admin clicks "Done" to mark the appointment as completed.
* **Why**: Drastically increases local SEO on Google Maps, bringing organic foot traffic.

### 8. Automated Reactivation Campaigns
* **Description**: A cron job that messages customers who haven't booked in the last 45 days.
* **Why**: Plugs the "leaky bucket" and brings churned customers back automatically.

### 9. Shareable Mini-Storefront Links
* **Description**: Generate a unique, beautiful mobile web link for each business to put in their Instagram bio.
* **Why**: Converts social media followers directly into booked appointments.

### 10. Referral / Loyalty Coupons
* **Description**: After an appointment, the bot sends a unique promo code for the customer to share with friends.
* **Why**: Incentivizes viral, word-of-mouth growth.

### 11. Pre-Paid Bookings & Deposits
* **Description**: Integrate Razorpay to collect deposits via WhatsApp payment links to secure slots.
* **Why**: Eliminates no-shows and secures revenue upfront.

### 12. Waitlist Feature
* **Description**: Customers can join a waitlist. If a slot opens up, the bot instantly messages the waitlist.
* **Why**: Ensures the merchant never has an empty chair due to last-minute cancellations.