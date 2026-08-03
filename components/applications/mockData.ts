export type ApplicationStatus =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Unknown";

export interface Application {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  date: string;
  email: string;
  subject: string;
  snippet: string;
  logo?: string;
  location: string;
  salary?: string;
  fullEmailContent: string;
  attachments: { name: string; size: string; type: string }[];
  aiSummary: string;
}

export const mockApplications: Application[] = [
  {
    id: "1",
    company: "Google",
    position: "Software Engineer",
    status: "Interview",
    date: "2 days ago",
    email: "jobs@google.com",
    subject: "Interview Invitation – Software Engineer at Google",
    snippet:
      "We would like to invite you to an interview for the Software Engineer position...",
    location: "Mountain View, CA (Remote)",
    salary: "$180k – $240k",
    fullEmailContent: `Hi Yasin,

Thank you for applying to the Software Engineer position at Google. We were impressed by your background and experience, and we'd love to invite you to move forward in our interview process.

We're scheduling a technical screening call with one of our engineers. The interview will cover:
• Data Structures & Algorithms
• System Design fundamentals
• Behavioral questions

Please use the following link to schedule your interview at your convenience:
https://interviews.google.com/schedule/xxx

The interview will be approximately 45–60 minutes and conducted via Google Meet.

We look forward to speaking with you!

Best regards,
Google Recruiting Team
careers@google.com`,
    attachments: [
      { name: "Interview_Guide.pdf", size: "1.2 MB", type: "pdf" },
      {
        name: "Google_Engineering_Culture.pdf",
        size: "840 KB",
        type: "pdf",
      },
    ],
    aiSummary:
      "Google has invited you for a technical screening for the Software Engineer role. The interview covers DSA, system design, and behavioral questions. Schedule via the provided link. Strong positive signal — move quickly!",
  },
  {
    id: "2",
    company: "Amazon",
    position: "Frontend Developer",
    status: "Applied",
    date: "Yesterday",
    email: "amazon-jobs@amazon.com",
    subject: "Application Received – Frontend Developer",
    snippet:
      "Thanks for applying to the Frontend Developer role at Amazon...",
    location: "Seattle, WA (Hybrid)",
    salary: "$140k – $190k",
    fullEmailContent: `Hi Yasin,

Thank you for applying to the Frontend Developer position at Amazon!

We have received your application and our team will review it shortly. Due to the high volume of applications, the review process may take 1–2 weeks. We'll be in touch if your profile matches our requirements.

In the meantime, feel free to explore more opportunities at:
https://www.amazon.jobs

Thank you for your interest in Amazon!

Best,
Amazon Talent Acquisition`,
    attachments: [],
    aiSummary:
      "Application acknowledged by Amazon for the Frontend Developer role. No action needed right now. Expect a response within 1–2 weeks. Consider following up if you don't hear back within 14 days.",
  },
  {
    id: "3",
    company: "Stripe",
    position: "Senior Frontend Engineer",
    status: "Offer",
    date: "3 days ago",
    email: "recruiting@stripe.com",
    subject: "🎉 Offer Letter – Senior Frontend Engineer at Stripe",
    snippet:
      "We're thrilled to offer you the Senior Frontend Engineer position...",
    location: "San Francisco, CA (Remote OK)",
    salary: "$200k – $260k + equity",
    fullEmailContent: `Hi Yasin,

We are absolutely thrilled to offer you the position of Senior Frontend Engineer at Stripe!

Your offer details:
• Base Salary: $215,000/year
• Signing Bonus: $25,000
• Equity: 0.05% RSUs vesting over 4 years
• Start Date: August 15, 2026
• Location: Remote (US-based)

Benefits include unlimited PTO, top-tier health insurance, $3,000 annual learning budget, and home office stipend.

Please review the attached offer letter and sign using DocuSign by July 24, 2026.

We can't wait to have you on the team!

Warm regards,
Marcus Webb
Head of Talent – Stripe`,
    attachments: [
      {
        name: "Offer_Letter_Yasin_Memon.pdf",
        size: "450 KB",
        type: "pdf",
      },
      { name: "Benefits_Overview_2026.pdf", size: "1.8 MB", type: "pdf" },
      { name: "Equity_Breakdown.xlsx", size: "210 KB", type: "xlsx" },
    ],
    aiSummary:
      "Congratulations! Stripe has extended a full offer. Base: $215k, signing bonus $25k, 0.05% RSUs. Action required: sign via DocuSign before July 24. This is an exceptional offer — compare with your other pipeline opportunities.",
  },
  {
    id: "4",
    company: "Notion",
    position: "Growth Engineer",
    status: "Rejected",
    date: "5 days ago",
    email: "hiring@notion.so",
    subject: "Your Application to Notion",
    snippet: "Thank you for taking the time to interview with us...",
    location: "New York, NY (Hybrid)",
    salary: "$130k – $170k",
    fullEmailContent: `Hi Yasin,

Thank you so much for taking the time to interview for the Growth Engineer role at Notion. We genuinely appreciated getting to know you and learning about your background.

After careful consideration, we've decided to move forward with another candidate whose experience more closely matches our current needs.

We know this isn't the news you were hoping for, and we're sorry for any disappointment. Your skills and enthusiasm were impressive, and we encourage you to apply again in the future as new roles open up.

We wish you the very best in your search!

Warmly,
The Notion Hiring Team`,
    attachments: [],
    aiSummary:
      "Notion has passed on your application after the interview stage. The rejection mentions fit with current needs — not a reflection of your skills. Consider reaching out to your interviewer on LinkedIn for specific feedback.",
  },
  {
    id: "5",
    company: "Vercel",
    position: "DevRel Engineer",
    status: "Interview",
    date: "1 week ago",
    email: "careers@vercel.com",
    subject: "Next Steps – DevRel Engineer at Vercel",
    snippet:
      "We'd love to move you to the next stage of our hiring process...",
    location: "Remote (Global)",
    salary: "$160k – $210k",
    fullEmailContent: `Hey Yasin,

We loved your application for the DevRel Engineer position at Vercel. You've clearly got a passion for developer experience, and that's exactly what we're looking for.

We'd like to schedule a 30-minute intro call with our hiring manager, Delba de Oliveira. During this call we'll discuss:
• Your experience with Next.js and the React ecosystem
• Content creation and community building background
• What excites you about developer relations

Please book a time here: https://cal.com/vercel-hiring/delba

Looking forward to connecting!

Cheers,
Vercel Hiring Team`,
    attachments: [
      { name: "DevRel_JD_Vercel.pdf", size: "320 KB", type: "pdf" },
    ],
    aiSummary:
      "Vercel wants to schedule an intro call for the DevRel Engineer role with Delba de Oliveira. Book a slot soon — first-come scheduling. Research Vercel's recent product launches before the call.",
  },
  {
    id: "6",
    company: "Linear",
    position: "Product Designer",
    status: "Applied",
    date: "1 week ago",
    email: "jobs@linear.app",
    subject: "Application Received – Product Designer",
    snippet:
      "We've received your application for the Product Designer role...",
    location: "Remote (US/EU)",
    salary: "$120k – $160k",
    fullEmailContent: `Hi Yasin,

Thanks for applying to the Product Designer position at Linear. We've received your application and portfolio.

Our team will be reviewing applications on a rolling basis. Given the quality of candidates we receive, reviews can take up to 3 weeks.

We appreciate your patience and interest in Linear.

Best,
Linear People Team`,
    attachments: [],
    aiSummary:
      "Application received at Linear for Product Designer. Review process may take up to 3 weeks. No action required. Consider working on a Linear-inspired case study to strengthen future conversations.",
  },
  {
    id: "7",
    company: "OpenAI",
    position: "Full Stack Engineer",
    status: "Unknown",
    date: "2 weeks ago",
    email: "recruiting@openai.com",
    subject: "Thank you for your interest in OpenAI",
    snippet:
      "We received your resume and will be in touch if there's a match...",
    location: "San Francisco, CA",
    salary: "$220k – $300k",
    fullEmailContent: `Hello,

Thank you for your interest in joining OpenAI! We've received your application for the Full Stack Engineer position.

Our talent team will review your profile carefully. Given the high volume of applications, we may not be able to respond to everyone individually. If your experience aligns with our current needs, a recruiter will reach out within 4–6 weeks.

Thank you again for your interest in OpenAI's mission.

The OpenAI Talent Team`,
    attachments: [],
    aiSummary:
      "OpenAI sent a generic acknowledgment email. Status unclear — likely an ATS auto-response. Consider following up in 3 weeks with a direct LinkedIn message to a recruiter. Competition is extremely high for this role.",
  },
  {
    id: "8",
    company: "Figma",
    position: "Senior React Developer",
    status: "Applied",
    date: "3 weeks ago",
    email: "jobs@figma.com",
    subject: "Application Submitted – Senior React Developer",
    snippet:
      "Your application to Figma has been received successfully...",
    location: "San Francisco, CA (Hybrid)",
    salary: "$170k – $220k",
    fullEmailContent: `Hi Yasin,

Your application for the Senior React Developer position at Figma has been submitted!

Our engineering team will review your application and portfolio. We particularly appreciate candidates with experience in:
• Complex state management
• Canvas/WebGL rendering
• Real-time collaboration features

We'll be in touch within 2 weeks if we'd like to move forward.

Thanks,
Figma Recruiting`,
    attachments: [],
    aiSummary:
      "Figma confirmed receipt of your Senior React Developer application. They're looking for canvas/WebGL and real-time collaboration experience. If you have relevant projects, consider linking them in a follow-up email.",
  },
];

export const mockStats = {
  total: 124,
  interviews: 12,
  offers: 3,
  rejected: 18,
};
