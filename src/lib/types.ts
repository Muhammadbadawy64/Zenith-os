// Brainhance OS Database Type Definitions
// Matches the Supabase schema defined in the master prompt

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  preferred_language: "ar" | "en";
  created_at: string;
}

export interface AssessmentIkigai {
  id: string;
  user_id: string;
  love: string[];
  good_at: string[];
  world_needs: string[];
  paid_for: string[];
  ikigai_statement: string | null;
  created_at: string;
}

export interface AssessmentWheelOfLife {
  id: string;
  user_id: string;
  career: number;
  relationships: number;
  health: number;
  finances: number;
  personal_growth: number;
  fun: number;
  physical_env: number;
  spirituality: number;
  scores_json: Record<string, number>;
  assessment_date: string;
}

export interface LifeMessage {
  id: string;
  user_id: string;
  core_message: string;
  how_people_perceive_me: string;
  impact_i_want: string;
  legacy_statement: string;
}

export type RoleCategory = "self" | "passion" | "others";

export interface LifeRole {
  id: string;
  user_id: string;
  role_name: string;
  category: RoleCategory;
  description: string;
  icon: string;
  color: string;
  weekly_hours_goal: number;
}

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string;
  role_id: string | null;
  title: string;
  description: string;
  deadline: string | null;
  status: GoalStatus;
  progress_percentage: number;
}

export type PlannerEntryType = "yearly" | "monthly" | "weekly" | "daily";

export interface PlannerEntry {
  id: string;
  user_id: string;
  entry_type: PlannerEntryType;
  title: string;
  content: string;
  date: string;
  related_goal_id: string | null;
}

export interface DailyEnergy {
  id: string;
  user_id: string;
  date: string;
  energy_level: number; // 1-10
  mood: string;
  notes: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  task_name: string;
  role_id: string | null;
  is_distracted: boolean;
  distraction_note: string | null;
}

export interface VoiceJournal {
  id: string;
  user_id: string;
  audio_url: string;
  transcription_text: string | null;
  ai_summary: string | null;
  created_at: string;
}

export type AIRole = "user" | "assistant";
export type AIContextType = "coach" | "alert" | "report";

export interface AIConversation {
  id: string;
  user_id: string;
  role: AIRole;
  message: string;
  context_type: AIContextType;
  created_at: string;
}

// Onboarding state
export interface OnboardingData {
  step: number;
  whoAmI: {
    skills: string[];
    passions: string[];
    values: string[];
  };
  theWhy: {
    drivingForce: string;
    lifeMessage: string;
  };
  ikigai: {
    love: string[];
    goodAt: string[];
    worldNeeds: string[];
    paidFor: string[];
  };
  wheelOfLife: {
    career: number;
    relationships: number;
    health: number;
    finances: number;
    personalGrowth: number;
    fun: number;
    physicalEnv: number;
    spirituality: number;
  };
  lifeReevaluation: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    priorities: string[];
  };
}
