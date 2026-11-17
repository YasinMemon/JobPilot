import { Document } from "mongodb";
import mongoose from "mongoose";

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface IAttachment {
  filename: string;
  mimeType: string;
  size?: number;
}

// ─── Status Enum ─────────────────────────────────────────────────────────────

export enum ApplicationStatus {
  APPLIED = "Applied",
  VIEWED = "Viewed",
  INTERVIEW = "Interview",
  ASSESSMENT = "Assessment",
  SHORTLISTED = "Shortlisted",
  OFFER = "Offer",
  REJECTED = "Rejected",
  HIRED = "Hired",
  UNKNOWN = "Unknown",
}

// ─── Mongoose Document (server-side) ─────────────────────────────────────────

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;

  gmailMessageId: string;
  threadId: string;

  // Company info
  company: string;
  companyLogo?: string;
  position: string;

  // Contact info
  recruiterEmail?: string;
  candidateEmail?: string;

  // Job details
  location?: string;
  salary?: string;
  platform?: string;
  appliedVia?: string;

  // Status
  status: ApplicationStatus;

  // Email fields
  subject: string;
  from: string;
  snippet: string;
  fullEmail: string;

  // AI fields
  aiSummary?: string;
  notes?: string;

  // Labels (user-defined tags)
  labels: string[];

  // Attachments
  attachments: IAttachment[];

  // Dates
  applicationDate?: Date;
  /** When the user's interview for this application takes place. */
  interviewAt?: Date | null;
  receivedAt: Date;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── Frontend Serialized Application (client-side) ───────────────────────────
// All ObjectIds and Dates are serialized to strings for JSON transport.

export interface Application {
  id: string;
  userId: string;

  gmailMessageId: string;
  threadId: string;

  // Company info
  company: string;
  companyLogo?: string;
  position: string;

  // Contact info
  email: string; // maps to `from` (recruiter/sender email)
  recruiterEmail?: string;
  candidateEmail?: string;

  // Job details
  location: string;
  salary?: string;
  platform?: string;
  appliedVia?: string;

  // Status
  status: ApplicationStatus;

  // Email fields
  subject: string;
  snippet: string;
  fullEmailContent: string; // maps to `fullEmail`

  // AI fields
  aiSummary: string;
  notes?: string;

  // Labels
  labels: string[];

  // Attachments (serialized)
  attachments: {
    name: string;
    size: string;
    type: string;
    mimeType: string;
  }[];

  // Dates (formatted strings for display)
  date: string; // human-readable relative date
  applicationDate?: string;
  interviewAt?: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Filter / Query Params ────────────────────────────────────────────────────

export interface ApplicationFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus | "All";
  platform?: string;
  appliedVia?: string;
  labels?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: "applicationDate" | "company" | "status" | "receivedAt";
  sortOrder?: "asc" | "desc";
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApplicationResponse {
  success: boolean;
  data: Application[];
  pagination: PaginationMeta;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  hired: number;
  successRate: number;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  total: number;
  message: string;
}
