export interface User {
  _id: string;
  email: string;
  fullName: string;
  currentJobTitle: string;
  yearsOfExperience: string;
  currentLocation: string;
  skills: string[];
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  resume?: string;
  avatar?: string;
  image?: string;  // from OAuth provider (Google etc.)
  headline?: string;

  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  socialLinks?: {
    portfolio?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    facebook?: string;
  };

  currentCompany?: string;
  currentRole?: string;
  workMode?: string;
  prefferredJobType?: string;
  noticePeriod?: string;
  expectedSalary?: string;
  education?: {
    degree?: string;
    university?: string;
    passingYear?: string;
    cgpa?: string;
  };
  accountType?: "Free" | "Premium";
  emailVerified?: boolean;
  memberSince?: string;
  lastLogin?: string;
}
