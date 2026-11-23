import {
  BarChart3,
  BookOpen,
  BookText,
  CalendarRange,
  Ear,
  FileCheck2,
  Home,
  Library,
  Mic,
  MessageCircle,
  PenLine,
  Puzzle,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "skills" | "track";
}

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, group: "main" },
  { href: "/plan", label: "My Study Plan", icon: CalendarRange, group: "main" },
  { href: "/lessons", label: "Daily Lessons", icon: BookOpen, group: "main" },
  { href: "/tutor", label: "AI Tutor", icon: MessageCircle, group: "main" },
  { href: "/reading", label: "Reading", icon: BookText, group: "skills" },
  { href: "/use-of-english", label: "Use of English", icon: Puzzle, group: "skills" },
  { href: "/listening", label: "Listening", icon: Ear, group: "skills" },
  { href: "/writing", label: "Writing", icon: PenLine, group: "skills" },
  { href: "/speaking", label: "Speaking", icon: Mic, group: "skills" },
  { href: "/vocabulary", label: "Vocabulary", icon: Library, group: "skills" },
  { href: "/mock-exams", label: "Mock Exams", icon: FileCheck2, group: "track" },
  { href: "/mistakes", label: "My Mistakes", icon: TriangleAlert, group: "track" },
  { href: "/statistics", label: "Statistics", icon: BarChart3, group: "track" },
  { href: "/settings", label: "Settings", icon: Settings, group: "track" },
];

export const MOBILE_TABS = ["/", "/plan", "/lessons", "/vocabulary"];
