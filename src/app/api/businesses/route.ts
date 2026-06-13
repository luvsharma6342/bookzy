import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheGet, cacheSet, cacheDel, cacheKeys, TTL } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  if (slug) {
    // Try cache first
    const cached = await cacheGet(cacheKeys.businessBySlug(slug));
    if (cached) return NextResponse.json(cached);

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    // Populate both slug and id caches
    await Promise.all([
      cacheSet(cacheKeys.businessBySlug(slug), business, TTL.STOREFRONT),
      cacheSet(cacheKeys.businessById(business.id), business, TTL.STOREFRONT),
    ]);
    return NextResponse.json(business);
  }

  if (id) {
    const cached = await cacheGet(cacheKeys.businessById(id));
    if (cached) return NextResponse.json(cached);

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    await cacheSet(cacheKeys.businessById(id), business, TTL.STOREFRONT);
    return NextResponse.json(business);
  }

  // Authenticated owner list — not cached (changes often per user)
  const session = await auth.api.getSession({ headers: await headers() });

  let businesses;
  if (session?.user) {
    businesses = await prisma.business.findMany({ where: { ownerId: session.user.id } });
  } else {
    businesses = await prisma.business.findMany();
  }

  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, category, phone, city, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const workingHours = {
      monday:    { open: "09:00", close: "20:00", closed: false },
      tuesday:   { open: "09:00", close: "20:00", closed: false },
      wednesday: { open: "09:00", close: "20:00", closed: false },
      thursday:  { open: "09:00", close: "20:00", closed: false },
      friday:    { open: "09:00", close: "20:00", closed: false },
      saturday:  { open: "09:00", close: "20:00", closed: false },
      sunday:    { open: "09:00", close: "20:00", closed: false },
    };

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        category: category || "General Services",
        phone: phone || "+919999999999",
        city: city || "Local Area",
        description: description || "",
        workingHours,
        ownerId: session.user.id,
        plan: "free",
        rating: 5.0,
        reviewsCount: 0,
      },
    });

    return NextResponse.json(business);
  } catch (error: any) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: error.message || "Failed to create business" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      id, 
      name, 
      category, 
      phone, 
      city, 
      description, 
      workingHours, 
      plan, 
      planStatus, 
      planExpiresAt, 
      razorpaySubscriptionId,
      metaWabaId,
      metaPhoneNumberId,
      metaPermanentToken
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const existing = await prisma.business.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (existing.ownerId && existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        name,
        category,
        phone,
        city,
        description,
        workingHours: workingHours || undefined,
        plan: plan || undefined,
        planStatus: planStatus || undefined,
        planExpiresAt: planExpiresAt || undefined,
        razorpaySubscriptionId: razorpaySubscriptionId !== undefined ? razorpaySubscriptionId : undefined,
        metaWabaId: metaWabaId !== undefined ? metaWabaId : undefined,
        metaPhoneNumberId: metaPhoneNumberId !== undefined ? metaPhoneNumberId : undefined,
        metaPermanentToken: metaPermanentToken !== undefined ? metaPermanentToken : undefined,
      },
    });

    // Invalidate caches for this business
    await cacheDel(
      cacheKeys.businessById(id),
      cacheKeys.businessBySlug(updated.slug)
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating business:", error);
    return NextResponse.json({ error: error.message || "Failed to update business" }, { status: 500 });
  }
}
