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
      holiday_cache: {
        Row: {
          country_code: string
          fetched_at: string | null
          holidays: Json
          id: string
          year: number
        }
        Insert: {
          country_code: string
          fetched_at?: string | null
          holidays: Json
          id?: string
          year: number
        }
        Update: {
          country_code?: string
          fetched_at?: string | null
          holidays?: Json
          id?: string
          year?: number
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
      plan_limits: {
        Row: {
          can_invite_users: boolean | null
          can_schedule_future: boolean | null
          cards_per_content: number
          created_at: string | null
          max_guests: number | null
          max_workspaces: number
          plan_type: string
          weekly_scripts: number
        }
        Insert: {
          can_invite_users?: boolean | null
          can_schedule_future?: boolean | null
          cards_per_content: number
          created_at?: string | null
          max_guests?: number | null
          max_workspaces?: number
          plan_type: string
          weekly_scripts: number
        }
        Update: {
          can_invite_users?: boolean | null
          can_schedule_future?: boolean | null
          cards_per_content?: number
          created_at?: string | null
          max_guests?: number | null
          max_workspaces?: number
          plan_type?: string
          weekly_scripts?: number
        }
        Relationships: []
      }
      production_schedules: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          scheduled_date: string
          script_id: string
          stage: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          scheduled_date: string
          script_id: string
          stage: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          scheduled_date?: string
          script_id?: string
          stage?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_schedules_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_settings: {
        Row: {
          is_enabled: boolean | null
          stage_slas: Json | null
          updated_at: string | null
          user_id: string
          work_days: number[] | null
        }
        Insert: {
          is_enabled?: boolean | null
          stage_slas?: Json | null
          updated_at?: string | null
          user_id: string
          work_days?: number[] | null
        }
        Update: {
          is_enabled?: boolean | null
          stage_slas?: Json | null
          updated_at?: string | null
          user_id?: string
          work_days?: number[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_workflow: string | null
          daily_goal_minutes: number | null
          desktop_tutorial_completed: boolean | null
          extra_workspaces_packs: number | null
          first_login: boolean | null
          highest_level: number | null
          is_internal_tester: boolean | null
          min_streak_minutes: number | null
          notifications_enabled: boolean | null
          notion_access_token: string | null
          notion_workspace_id: string | null
          onboarding_data: Json | null
          plan_type: string
          preferred_platform: string | null
          preferred_session_minutes: number | null
          reminder_time: string | null
          streak_freezes: number | null
          timer_start_mode: string | null
          timezone: string
          tutorial_progress: Json | null
          upgrade_celebrated: Json
          user_id: string
          username: string | null
          weekly_goal_minutes: number | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_workflow?: string | null
          daily_goal_minutes?: number | null
          desktop_tutorial_completed?: boolean | null
          extra_workspaces_packs?: number | null
          first_login?: boolean | null
          highest_level?: number | null
          is_internal_tester?: boolean | null
          min_streak_minutes?: number | null
          notifications_enabled?: boolean | null
          notion_access_token?: string | null
          notion_workspace_id?: string | null
          onboarding_data?: Json | null
          plan_type?: string
          preferred_platform?: string | null
          preferred_session_minutes?: number | null
          reminder_time?: string | null
          streak_freezes?: number | null
          timer_start_mode?: string | null
          timezone?: string
          tutorial_progress?: Json | null
          upgrade_celebrated?: Json
          user_id: string
          username?: string | null
          weekly_goal_minutes?: number | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_workflow?: string | null
          daily_goal_minutes?: number | null
          desktop_tutorial_completed?: boolean | null
          extra_workspaces_packs?: number | null
          first_login?: boolean | null
          highest_level?: number | null
          is_internal_tester?: boolean | null
          min_streak_minutes?: number | null
          notifications_enabled?: boolean | null
          notion_access_token?: string | null
          notion_workspace_id?: string | null
          onboarding_data?: Json | null
          plan_type?: string
          preferred_platform?: string | null
          preferred_session_minutes?: number | null
          reminder_time?: string | null
          streak_freezes?: number | null
          timer_start_mode?: string | null
          timezone?: string
          tutorial_progress?: Json | null
          upgrade_celebrated?: Json
          user_id?: string
          username?: string | null
          weekly_goal_minutes?: number | null
          xp_points?: number | null
        }
        Relationships: []
      }
<<<<<<< ours
      script_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          resolved: boolean
          script_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resolved?: boolean
          script_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resolved?: boolean
          script_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
      production_schedules: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          scheduled_date: string
          script_id: string
          stage: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          scheduled_date: string
          script_id: string
          stage: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          scheduled_date?: string
          script_id?: string
          stage?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_schedules_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_settings: {
        Row: {
          is_enabled: boolean | null
          stage_slas: Json | null
          updated_at: string | null
          user_id: string
          work_days: number[] | null
        }
        Insert: {
          is_enabled?: boolean | null
          stage_slas?: Json | null
          updated_at?: string | null
          user_id: string
          work_days?: number[] | null
        }
        Update: {
          is_enabled?: boolean | null
          stage_slas?: Json | null
          updated_at?: string | null
          user_id?: string
          work_days?: number[] | null
>>>>>>> theirs
        }
        Relationships: []
      }
      scripts: {
        Row: {
          central_idea: string | null
          client_approved_at: string | null
          content: string | null
          content_type: string | null
          created_at: string
          date_manually_set: boolean | null
          design_items: Json | null
          editing_notes: string | null
          editing_progress: string[] | null
          editing_times: Json | null
          id: string
          main_video_type: string | null
          main_video_url: string | null
          music_reference: Json | null
          notes: string | null
          notion_page_id: string | null
          original_content: string | null
          publish_date: string | null
          publish_status: string | null
          published_at: string | null
          reference_links: string[] | null
          reference_url: string | null
          shot_list: string[] | null
          stage_progress: Json | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_references: Json | null
          workflow_template: string | null
          workspace_id: string | null
        }
        Insert: {
          central_idea?: string | null
          client_approved_at?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          date_manually_set?: boolean | null
          design_items?: Json | null
          editing_notes?: string | null
          editing_progress?: string[] | null
          editing_times?: Json | null
          id?: string
          main_video_type?: string | null
          main_video_url?: string | null
          music_reference?: Json | null
          notes?: string | null
          notion_page_id?: string | null
          original_content?: string | null
          publish_date?: string | null
          publish_status?: string | null
          published_at?: string | null
          reference_links?: string[] | null
          reference_url?: string | null
          shot_list?: string[] | null
          stage_progress?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_references?: Json | null
          workflow_template?: string | null
          workspace_id?: string | null
        }
        Update: {
          central_idea?: string | null
          client_approved_at?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          date_manually_set?: boolean | null
          design_items?: Json | null
          editing_notes?: string | null
          editing_progress?: string[] | null
          editing_times?: Json | null
          id?: string
          main_video_type?: string | null
          main_video_url?: string | null
          music_reference?: Json | null
          notes?: string | null
          notion_page_id?: string | null
          original_content?: string | null
          publish_date?: string | null
          publish_status?: string | null
          published_at?: string | null
          reference_links?: string[] | null
          reference_url?: string | null
          shot_list?: string[] | null
          stage_progress?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_references?: Json | null
          workflow_template?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
          had_pause: boolean | null
          id: string
          stage: string | null
          started_at: string | null
          user_id: string
          was_abandoned: boolean | null
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          had_pause?: boolean | null
          id?: string
          stage?: string | null
          started_at?: string | null
          user_id: string
          was_abandoned?: boolean | null
        }
        Update: {
          content_item_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          had_pause?: boolean | null
          id?: string
          stage?: string | null
          started_at?: string | null
          user_id?: string
          was_abandoned?: boolean | null
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
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          plan_type: string
          raw_payload: Json | null
          refunded_at: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
          zouti_customer_email: string
          zouti_product_id: string | null
          zouti_subscription_id: string | null
          zouti_transaction_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          raw_payload?: Json | null
          refunded_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          zouti_customer_email: string
          zouti_product_id?: string | null
          zouti_subscription_id?: string | null
          zouti_transaction_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          raw_payload?: Json | null
          refunded_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          zouti_customer_email?: string
          zouti_product_id?: string | null
          zouti_subscription_id?: string | null
          zouti_transaction_id?: string | null
        }
        Relationships: []
      }
      user_recaps: {
        Row: {
          avg_daily_minutes: number | null
          computed_stats: Json | null
          created_at: string | null
          days_active: number
          followers_count: number | null
          had_viral: boolean | null
          id: string
          is_eligible: boolean | null
          period_end: string
          period_start: string
          period_type: string
          sessions_count: number
          total_minutes: number
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          avg_daily_minutes?: number | null
          computed_stats?: Json | null
          created_at?: string | null
          days_active?: number
          followers_count?: number | null
          had_viral?: boolean | null
          id?: string
          is_eligible?: boolean | null
          period_end: string
          period_start: string
          period_type: string
          sessions_count?: number
          total_minutes?: number
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          avg_daily_minutes?: number | null
          computed_stats?: Json | null
          created_at?: string | null
          days_active?: number
          followers_count?: number | null
          had_viral?: boolean | null
          id?: string
          is_eligible?: boolean | null
          period_end?: string
          period_start?: string
          period_type?: string
          sessions_count?: number
          total_minutes?: number
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trophies: {
        Row: {
          created_at: string
          id: string
          shown: boolean
          trophy_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shown?: boolean
          trophy_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shown?: boolean
          trophy_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_invites: {
        Row: {
          allowed_timer_stages: string[]
          can_edit_stages: string[]
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          workspace_id: string
        }
        Insert: {
          allowed_timer_stages?: string[]
          can_edit_stages?: string[]
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          workspace_id: string
        }
        Update: {
          allowed_timer_stages?: string[]
          can_edit_stages?: string[]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          allowed_timer_stages: string[]
          can_edit_stages: string[]
          email: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          allowed_timer_stages?: string[]
          can_edit_stages?: string[]
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          allowed_timer_stages?: string[]
          can_edit_stages?: string[]
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          max_guests: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_guests?: number
          name?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_guests?: number
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          plan_type: string
          user_id: string
          username: string
        }[]
      }
      admin_set_plan_type: {
        Args: { new_plan: string; target_user: string }
        Returns: undefined
      }
      can_edit_stage: {
        Args: { _stage: string; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      can_invite_to_workspace: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      can_use_timer: {
        Args: { _stage: string; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      can_view_workspace_as_invitee: {
        Args: { _email: string; _workspace_id: string }
        Returns: boolean
      }
      get_invite_by_id: {
        Args: { invite_id: string }
        Returns: {
          allowed_timer_stages: string[]
          can_edit_stages: string[]
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          workspace_id: string
          workspace_name: string
          workspace_owner_id: string
        }[]
      }
      get_monthly_stage_summary: {
        Args: {
          p_end_utc: string
          p_start_utc: string
          p_timezone?: string
          p_user_id: string
        }
        Returns: {
          day_key: string
          total_minutes: number
        }[]
      }
      get_stage_time_summary: {
        Args: never
        Returns: {
          sessions_over_25: number
          sessions_without_abandon: number
          sessions_without_pause: number
          total_seconds: number
          used_stages: string[]
        }[]
      }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_user_workspace: { Args: { _user_id: string }; Returns: string }
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
      get_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      grant_role_by_email: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_invite: { Args: { _workspace_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member_safe: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner_safe: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "developer" | "admin" | "user"
      workspace_role: "owner" | "admin" | "collaborator" | "client"
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
      app_role: ["developer", "admin", "user"],
      workspace_role: ["owner", "admin", "collaborator", "client"],
    },
  },
} as const
