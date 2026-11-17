import {
  LayoutDashboard,
  BriefcaseBusiness,
  Briefcase,
  Bot,
  User,
  Settings,
  Bell,
  FileText,
} from "lucide-react";

export const dashboardNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Applications",
    href: "/dashboard/applications",
    icon: Briefcase,
  },
  {
    title: "AI Assistant",
    href: "/dashboard/ai",
    icon: Bot,
  },
  {
    title: "Resume Generator",
    href: "/dashboard/resume",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
