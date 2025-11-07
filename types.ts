import { CSSProperties } from 'react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Activity {
  _id: string; // From MongoDB
  text: string;
  icon: string; // 'summarizer', 'task', 'profile', 'group', 'writing'
  createdAt: string; // Will be an ISO date string
  userId: string;
}

// --- NEW: Add Stats types ---
export interface ChartData {
  label: string;
  value: number;
}

export interface AppStats {
  daily: ChartData[];
  weekly: ChartData[];
  monthly: ChartData[];
}
// --- End NEW ---

export interface PdfPage {
  pageNumber: number;
  imageUrl: string;
  text: string;
}

export enum AppView {
  LOGIN,
  ONBOARDING,
  DASHBOARD,
  SUMMARIZER,
  PROFILE,
  CREATE_PROFILE,
  MEMORY,
  STORYFY,
  WRITING_WIZARD,
}

export enum SummarizerView {
  UPLOAD,
  PROCESSING,
  RESULTS,
  ERROR,
  NOTEBOOK,
  TAKE_PHOTO,
}

export interface ChunkSummary {
  summary: string;
  doodleUrl: string | null;
  pageNumber: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface User {
    id: string;
    email: string;
    password?: string;
    fullName?: string;
    username?: string;
    profilePictureUrl?: string;
    status?: string;
    role?: string;
    badges?: Badge[];
    skills?: Skill[];
    stats?: {
        studyHours: number;
        courses: number;
        daysStreak: number;
        achievements: number;
    };
    integrations?: {
        slack: boolean;
        zoom: boolean;
        teams: boolean;
    };
}

export interface UserNote {
  id: string;
  pageNumber: number;
  content: string;
  style: CSSProperties;
  createdAt: Date;
}

export interface Document {
    id: string;
    fileName: string;
    createdAt: Date;
    sourcePdfDataUrl?: string; // optional, for client-side PDF rendering
    pdfPages: PdfPage[];
    chunkSummaries: ChunkSummary[];
    notebookSummary: string;
    totalSummary: string;
    miniExercise: string;
    userNotes: UserNote[];
}

export interface WritingDocument {
  id:string;
  title: string;
  content: string; // HTML content from the rich text editor
  lastModified: Date;
}

// --- Onboarding Types ---
export type Privacy = "Public" | "Private";

export interface Member {
  id:string;
  name: string;
  role: "Lead Researcher" | "Contributor" | "Reviewer" | "Mentor";
}

export interface GroupDraft {
  name: string;
  description: string;
  purpose: string;
  categories: string[];
  privacy: Privacy;
  members: Member[];
  tools: string[];
  template?: "clinical-study" | "computational-research" | "social-science-survey";
}
