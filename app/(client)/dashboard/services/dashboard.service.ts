/**
 * Dashboard API service layer.
 *
 * All raw HTTP calls for the dashboard feature live here.
 * UI components never call fetch/axios directly.
 */

import { api } from "@/lib/axios/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleStatusResponse {
  connected: boolean;
}

export interface ProfileData {
  fullName?: string;
  name?: string;
  avatar?: string;
  image?: string;
}

export interface ProfileApiResponse {
  success: boolean;
  data: ProfileData;
}

export interface GenerateEmailPayload {
  jd: string;
  hasResume?: boolean;
  hasPortfolio?: boolean;
}

export interface GenerateEmailResponse {
  success: boolean;
  subject: string;
  html: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Check whether the user's Google account is connected.
 * Silently returns null on network failure to avoid blocking the dashboard.
 */
export async function fetchGoogleStatus(): Promise<GoogleStatusResponse | null> {
  try {
    const res = await api.get<GoogleStatusResponse>("/account/google-status");
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Fetch the current user's profile for display in the dashboard header.
 */
export async function fetchUserProfile(): Promise<ProfileApiResponse> {
  const res = await api.get<ProfileApiResponse>("/profile");
  return res.data;
}

/**
 * Generate a cold email from a job description using AI.
 * Returns a suggested subject line and an HTML body.
 */
export async function generateEmail(
  payload: GenerateEmailPayload,
): Promise<GenerateEmailResponse> {
  const res = await api.post<GenerateEmailResponse>("/email", payload);
  return res.data;
}

/**
 * Send the composed email via Gmail, including optional file attachments.
 * Uses multipart/form-data so binary attachments can be included.
 */
export async function sendEmailWithAttachments(
  formData: FormData,
): Promise<SendEmailResponse> {
  const res = await api.post<SendEmailResponse>("/send-email", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
