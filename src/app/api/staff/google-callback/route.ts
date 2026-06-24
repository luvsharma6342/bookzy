import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/googleCalendar";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const staffId = searchParams.get("state"); // We passed staffId in the 'state' parameter

  if (!code || !staffId) {
    return NextResponse.json({ error: "Authorization code and staffId are required" }, { status: 400 });
  }

  try {
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
       return NextResponse.json({ error: "Failed to obtain refresh token. Please revoke access from Google Account and try again." }, { status: 400 });
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

    // You can redirect to a success page here
    return new NextResponse(`
      <html>
        <head>
          <title>Calendar Connected</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f3f4f6; color: #1f2937; text-align: center; }
            .card { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; }
            h1 { color: #10b981; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Success!</h1>
            <p>Your Google Calendar has been successfully connected. You can now close this window.</p>
            <script>
              setTimeout(() => { window.close(); }, 3000);
            </script>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error: any) {
    console.error("Error exchanging Google OAuth code:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate with Google" }, { status: 500 });
  }
}
