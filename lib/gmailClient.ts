import { google } from "googleapis";

/**
 * Creates an authenticated Gmail API client using a user's access token.
 *
 * @param accessToken - The Google OAuth2 access token stored by Better Auth
 * @returns An authenticated Gmail API client
 */
export function createGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
