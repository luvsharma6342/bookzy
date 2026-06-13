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
  const cached = await cacheGet(cacheKeys.staff(businessId));
  if (cached) return NextResponse.json(cached);

  const staff = await prisma.staff.findMany({ where: { businessId } });

  await cacheSet(cacheKeys.staff(businessId), staff, TTL.STOREFRONT);
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, businessId, name, role, photoUrl, rating } = body;

    if (!businessId || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId && business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let staffMember;
    if (id && !id.startsWith("st-")) {
      staffMember = await prisma.staff.update({
        where: { id },
        data: {
          name,
          role,
          photoUrl: photoUrl || null,
          rating: rating ? parseFloat(rating) : undefined,
        },
      });
    } else {
      staffMember = await prisma.staff.create({
        data: {
          name,
          role,
          photoUrl: photoUrl || null,
          rating: rating ? parseFloat(rating) : 5.0,
          businessId,
        },
      });
    }

    // Invalidate staff cache
    await cacheDel(cacheKeys.staff(businessId));

    return NextResponse.json(staffMember);
  } catch (error: any) {
    console.error("Error saving staff:", error);
    return NextResponse.json({ error: error.message || "Failed to save staff" }, { status: 500 });
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
    return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
  }

  try {
    const staffMember = await prisma.staff.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (staffMember.business.ownerId && staffMember.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.staff.delete({ where: { id } });

    // Invalidate staff cache
    await cacheDel(cacheKeys.staff(staffMember.businessId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: error.message || "Failed to delete staff" }, { status: 500 });
  }
}
