import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import { customSession } from "better-auth/plugins";

import type { AppRole } from "@/lib/auth/routeConfig";
import clientPromise from "./mongodb";
import { notifySecurityEvent } from "@/lib/notifications/triggers";

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

  // Security notifications. These hooks only observe completed events; they
  // never alter or block authentication, and notification errors are swallowed.
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password") return;
      if (ctx.context.returned instanceof Error) return; // change failed

      const userId =
        ctx.context.newSession?.user.id ?? ctx.context.session?.user.id;
      if (userId) await notifySecurityEvent(userId, "password_changed");
    }),
  },

  databaseHooks: {
    account: {
      create: {
        after: async (account, ctx) => {
          // Only the "link Google to an existing account" flow is a security
          // event. Signing up with Google also creates an account row, so skip
          // accounts created right after the user itself.
          if (account.providerId !== "google" || !ctx) return;
          try {
            const user = await ctx.context.internalAdapter.findUserById(
              account.userId,
            );
            const ageMs = user
              ? Date.now() - new Date(user.createdAt).getTime()
              : 0;
            if (user && ageMs > 2 * 60 * 1000) {
              await notifySecurityEvent(account.userId, "google_connected");
            }
          } catch (err) {
            console.error("[auth] google_connected notification failed:", err);
          }
        },
      },
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

  trustedOrigins: [process.env.BETTER_AUTH_URL!, "https://jobpilot.cc"],

  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET!,
});
