import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobPilot | AI-powered job applications",
  description:
    "JobPilot helps job seekers manage applications, tailor resumes, and move faster with AI-assisted workflows.",
  keywords: [
    "AI job application",
    "resume optimizer",
    "job tracker",
    "interview prep",
    "application email generator",
  ],
  authors: [{ name: "JobPilot" }],
  openGraph: {
    title: "JobPilot | AI-powered job applications",
    description: "Manage applications and tailor your job search with AI.",
    type: "website",
    url: "https://jobpilot.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobPilot | AI-powered job applications",
    description: "Manage applications and tailor your job search with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakarta.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
