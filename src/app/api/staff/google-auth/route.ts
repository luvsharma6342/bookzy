import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId");

  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }

  // Generate auth URL
  const url = getAuthUrl(staffId);

  // Redirect to Google's OAuth consent screen
  return NextResponse.redirect(url);
}
