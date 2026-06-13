import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const services = await prisma.service.findMany({
    where: { businessId },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, businessId, name, price, duration, description, category, active } = body;

    if (!businessId || !name || price === undefined || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId && business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let service;
    if (id && !id.startsWith("s-")) {
      // Update
      service = await prisma.service.update({
        where: { id },
        data: {
          name,
          price: parseFloat(price),
          duration: parseInt(duration),
          description: description || "",
          category: category || "General",
          active: active !== undefined ? active : true,
        },
      });
    } else {
      // Create new
      service = await prisma.service.create({
        data: {
          name,
          price: parseFloat(price),
          duration: parseInt(duration),
          description: description || "",
          category: category || "General",
          active: active !== undefined ? active : true,
          businessId,
        },
      });
    }

    return NextResponse.json(service);
  } catch (error: any) {
    console.error("Error saving service:", error);
    return NextResponse.json({ error: error.message || "Failed to save service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.business.ownerId && service.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
