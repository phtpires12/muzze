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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          error_message: string | null
          id: string
          notification_date: string
          notification_type: string
          sent_at: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          notification_date: string
          notification_type: string
          sent_at?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          notification_date?: string
          notification_type?: string
          sent_at?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          current_workflow: string | null
          daily_goal_minutes: number | null
          first_login: boolean | null
          min_streak_minutes: number | null
          notifications_enabled: boolean | null
          onboarding_data: Json | null
          preferred_platform: string | null
          preferred_session_minutes: number | null
          reminder_time: string | null
          streak_freezes: number | null
          timezone: string
          user_id: string
          username: string | null
          weekly_goal_minutes: number | null
          xp_points: number | null
        }
        Insert: {
          created_at?: string | null
          current_workflow?: string | null
          daily_goal_minutes?: number | null
          first_login?: boolean | null
          min_streak_minutes?: number | null
          notifications_enabled?: boolean | null
          onboarding_data?: Json | null
          preferred_platform?: string | null
          preferred_session_minutes?: number | null
          reminder_time?: string | null
          streak_freezes?: number | null
          timezone?: string
          user_id: string
          username?: string | null
          weekly_goal_minutes?: number | null
          xp_points?: number | null
        }
        Update: {
          created_at?: string | null
          current_workflow?: string | null
          daily_goal_minutes?: number | null
          first_login?: boolean | null
          min_streak_minutes?: number | null
          notifications_enabled?: boolean | null
          onboarding_data?: Json | null
          preferred_platform?: string | null
          preferred_session_minutes?: number | null
          reminder_time?: string | null
          streak_freezes?: number | null
          timezone?: string
          user_id?: string
          username?: string | null
          weekly_goal_minutes?: number | null
          xp_points?: number | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          central_idea: string | null
          content: string | null
          content_type: string | null
          created_at: string
          id: string
          original_content: string | null
          publish_date: string | null
          reference_links: string[] | null
          reference_url: string | null
          shot_list: string[] | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          central_idea?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          original_content?: string | null
          publish_date?: string | null
          reference_links?: string[] | null
          reference_url?: string | null
          shot_list?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          central_idea?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          original_content?: string | null
          publish_date?: string | null
          reference_links?: string[] | null
          reference_url?: string | null
          shot_list?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          digest_day: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_day?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_day?: number | null
          user_id?: string
        }
        Relationships: []
      }
      stage_times: {
        Row: {
          content_item_id: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          stage: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          stage?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          content_item_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          stage?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streak_freeze_usage: {
        Row: {
          created_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          last_event_date: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_event_date?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_event_date?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_weekly_leaderboard: {
        Args: never
        Returns: {
          rank: number
          user_id: string
          username: string
          weekly_ideas_count: number
          weekly_time_seconds: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
