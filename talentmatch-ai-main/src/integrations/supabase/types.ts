export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          candidate_id: string
          cover_note: string | null
          created_at: string
          id: string
          job_id: string
          match_breakdown: Json | null
          match_score: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id: string
          match_breakdown?: Json | null
          match_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id?: string
          match_breakdown?: Json | null
          match_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          answer: string | null
          created_at: string
          expected_keywords: string[] | null
          feedback: string | null
          id: string
          question: string
          question_index: number
          score: number | null
          session_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          expected_keywords?: string[] | null
          feedback?: string | null
          id?: string
          question: string
          question_index: number
          score?: number | null
          session_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          expected_keywords?: string[] | null
          feedback?: string | null
          id?: string
          question?: string
          question_index?: number
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string
          difficulty: string
          domain: string
          duration_seconds: number | null
          feedback: string | null
          id: string
          status: string
          tab_switches: number
          total_score: number | null
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          domain: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          status?: string
          tab_switches?: number
          total_score?: number | null
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          domain?: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          status?: string
          tab_switches?: number
          total_score?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          description: string
          employment_type: string | null
          experience_required: number
          id: string
          is_active: boolean
          location: string | null
          recruiter_id: string
          required_skills: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          employment_type?: string | null
          experience_required?: number
          id?: string
          is_active?: boolean
          location?: string | null
          recruiter_id: string
          required_skills?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          employment_type?: string | null
          experience_required?: number
          id?: string
          is_active?: boolean
          location?: string | null
          recruiter_id?: string
          required_skills?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          company_name: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string | null
          headline: string | null
          id: string
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          headline?: string | null
          id: string
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          headline?: string | null
          id?: string
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          ats_score: number | null
          candidate_id: string
          created_at: string
          extracted_skills: string[] | null
          id: string
          job_id: string | null
          missing_skills: string[] | null
          suggestions: string[] | null
          summary: string | null
        }
        Insert: {
          ats_score?: number | null
          candidate_id: string
          created_at?: string
          extracted_skills?: string[] | null
          id?: string
          job_id?: string | null
          missing_skills?: string[] | null
          suggestions?: string[] | null
          summary?: string | null
        }
        Update: {
          ats_score?: number | null
          candidate_id?: string
          created_at?: string
          extracted_skills?: string[] | null
          id?: string
          job_id?: string | null
          missing_skills?: string[] | null
          suggestions?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "recruiter" | "candidate"
      application_status: "applied" | "shortlisted" | "rejected" | "selected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["recruiter", "candidate"],
      application_status: ["applied", "shortlisted", "rejected", "selected"],
    },
  },
} as const
