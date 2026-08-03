import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { customSession } from "better-auth/plugins";

import type { AppRole } from "@/lib/auth/routeConfig";
import clientPromise from "./mongodb";

const client = await clientPromise;
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: client,
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: [
        "openid",
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      // Request offline access so Google issues a refresh token for persistent Gmail API access
      accessType: "offline",
      prompt: "consent",
    },
  },

  // Enable account linking — required for linkSocial() and unlinkAccount() to work
  account: {
    accountLinking: {
      enabled: true,
      // Allow linking even if the Google email differs from the registration email
      allowDifferentEmails: true,
    },
  },

  plugins: [
    customSession(async ({ user, session }) => {
      const role: AppRole =
        (user as { role?: AppRole }).role ?? "user";

      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }),
  ],

  trustedOrigins: [process.env.BETTER_AUTH_URL!],

  secret: process.env.AUTH_SECRET!,
});
