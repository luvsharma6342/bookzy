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

export function getAuthUrl(staffId: string) {
  const oauth2Client = getGoogleAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: staffId, // Pass staffId in state to identify them on callback
  });
  return url;
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getGoogleAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

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

  // Check if token is expired or close to expiring (within 5 minutes)
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
    } catch (error) {
      console.error('Failed to refresh Google token for staff:', staffId, error);
      return null;
    }
  }

  return oauth2Client;
}

export async function createCalendarEvent(staffId: string, eventDetails: any) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventDetails,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(staffId: string, eventId: string, eventDetails: any) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: eventDetails,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(staffId: string, eventId: string) {
  const auth = await getAuthenticatedClientForStaff(staffId);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

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

    const busyBlocks = response.data.calendars?.['primary']?.busy || [];
    return busyBlocks;
  } catch (error) {
    console.error('Error fetching Free/Busy from Google Calendar:', error);
    return [];
  }
}
