// Server Component — fetches all storefront data on the server before sending HTML.
// This eliminates the "Storefront Not Found" flash that occurred when the client
// component rendered with no data before the useEffect fetch completed.

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { cacheGet, cacheSet, cacheKeys, TTL } from '@/lib/redis';
import StorefrontClient from './StorefrontClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;

  // ─── Business (cache-aside) ───────────────────────────────────
  let business = await cacheGet<any>(cacheKeys.businessBySlug(slug));
  if (!business) {
    business = await prisma.business.findUnique({ where: { slug } });
    if (business) {
      await Promise.all([
        cacheSet(cacheKeys.businessBySlug(slug), business, TTL.STOREFRONT),
        cacheSet(cacheKeys.businessById(business.id), business, TTL.STOREFRONT),
      ]);
    }
  }

  if (!business) notFound();

  // ─── Parallel: services + staff + bookings + blocked (cache-aside each) ─
  const [cachedServices, cachedStaff, cachedBookings, cachedBlocked] = await Promise.all([
    cacheGet<any[]>(cacheKeys.services(business.id)),
    cacheGet<any[]>(cacheKeys.staff(business.id)),
    cacheGet<any[]>(cacheKeys.bookings(business.id)),
    cacheGet<any[]>(cacheKeys.blockedDates(business.id)),
  ]);

  const [services, staff, bookings, blockedDates] = await Promise.all([
    cachedServices
      ? Promise.resolve(cachedServices)
      : prisma.service.findMany({ where: { businessId: business.id } }).then(async (data) => {
          await cacheSet(cacheKeys.services(business.id), data, TTL.STOREFRONT);
          return data;
        }),
    cachedStaff
      ? Promise.resolve(cachedStaff)
      : prisma.staff.findMany({ where: { businessId: business.id } }).then(async (data) => {
          await cacheSet(cacheKeys.staff(business.id), data, TTL.STOREFRONT);
          return data;
        }),
    cachedBookings
      ? Promise.resolve(cachedBookings)
      : prisma.booking.findMany({
          where: { businessId: business.id },
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: { service: true },
        }).then(async (data) => {
          await cacheSet(cacheKeys.bookings(business.id), data, TTL.BOOKINGS);
          return data;
        }),
    cachedBlocked
      ? Promise.resolve(cachedBlocked)
      : prisma.blockedDate.findMany({
          where: { businessId: business.id },
          orderBy: { date: 'asc' },
        }).then(async (data) => {
          await cacheSet(cacheKeys.blockedDates(business.id), data, TTL.STOREFRONT);
          return data;
        }),
  ]);

  // Fire page_view analytic in background (non-blocking)
  prisma.analyticsEvent.create({
    data: { businessId: business.id, eventType: 'page_view' },
  }).catch(() => {});

  return (
    <StorefrontClient
      business={business}
      initialServices={services}
      initialStaff={staff}
      initialBookings={bookings}
      initialBlockedDates={blockedDates}
    />
  );
}

// Custom not-found is handled by next's notFound() above
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const business = await cacheGet<any>(cacheKeys.businessBySlug(slug))
    ?? await prisma.business.findUnique({ where: { slug } });

  if (!business) return { title: 'Storefront Not Found — Bookze' };

  return {
    title: `${business.name} — Book an Appointment | Bookze`,
    description: business.description || `Book an appointment with ${business.name} on Bookze.`,
  };
}
