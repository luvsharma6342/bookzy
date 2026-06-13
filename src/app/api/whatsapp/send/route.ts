import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getEffectivePlan, isPaidPlan } from "@/lib/planOverride";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, toPhone, templateName, params } = body;

    if (!businessId || !toPhone || !templateName) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, toPhone, templateName" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Auth check - must be the owner
    if (business.ownerId && business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Plan check - gated to paid plans (Growth/Pro)
    const effectivePlan = getEffectivePlan(business.plan);
    if (!isPaidPlan(effectivePlan)) {
      return NextResponse.json(
        { error: "WhatsApp Automation is only available on Growth & Pro plans" },
        { status: 403 }
      );
    }

    // Validate credentials presence
    if (!business.metaPhoneNumberId || !business.metaPermanentToken) {
      return NextResponse.json(
        { error: "WhatsApp credentials (Phone Number ID / Permanent Token) are not configured for this business." },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate(
      business.metaPhoneNumberId,
      business.metaPermanentToken,
      toPhone,
      templateName,
      params || []
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Error in /api/whatsapp/send:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
