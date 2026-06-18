import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheGet, cacheSet, cacheDel, cacheKeys, TTL } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  // Try cache first
  const cached = await cacheGet(cacheKeys.blockedDates(businessId));
  if (cached) return NextResponse.json(cached);

  const blocked = await prisma.blockedDate.findMany({ 
    where: { businessId },
    orderBy: { date: "asc" }
  });

  await cacheSet(cacheKeys.blockedDates(businessId), blocked, TTL.STOREFRONT);
  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, date, reason } = body;

    if (!businessId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId && business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert date block
    const blockedDate = await prisma.blockedDate.upsert({
      where: {
        businessId_date: {
          businessId,
          date,
        }
      },
      update: {
        reason: reason || null
      },
      create: {
        businessId,
        date,
        reason: reason || null
      }
    });

    // Invalidate cache
    await cacheDel(cacheKeys.blockedDates(businessId));

    return NextResponse.json(blockedDate);
  } catch (error: any) {
    console.error("Error saving blocked date:", error);
    return NextResponse.json({ error: error.message || "Failed to block date" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Blocked Date ID is required" }, { status: 400 });
  }

  try {
    const blocked = await prisma.blockedDate.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!blocked) {
      return NextResponse.json({ error: "Blocked date not found" }, { status: 404 });
    }

    if (blocked.business.ownerId && blocked.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.blockedDate.delete({ where: { id } });

    // Invalidate cache
    await cacheDel(cacheKeys.blockedDates(blocked.businessId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting blocked date:", error);
    return NextResponse.json({ error: error.message || "Failed to delete blocked date" }, { status: 500 });
  }
}
