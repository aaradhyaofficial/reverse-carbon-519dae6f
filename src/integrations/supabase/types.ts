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
      daily_action_limits: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          count: number
          day: string
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          count?: number
          day: string
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          count?: number
          day?: string
          user_id?: string
        }
        Relationships: []
      }
      green_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          carbon_kg_saved: number
          created_at: string
          device_fingerprint: string | null
          distance_km: number
          duration_min: number
          id: string
          points_earned: number
          raw_payload: Json | null
          region_code: string
          user_id: string
          verified: boolean
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          carbon_kg_saved?: number
          created_at?: string
          device_fingerprint?: string | null
          distance_km?: number
          duration_min?: number
          id?: string
          points_earned?: number
          raw_payload?: Json | null
          region_code?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          carbon_kg_saved?: number
          created_at?: string
          device_fingerprint?: string | null
          distance_km?: number
          duration_min?: number
          id?: string
          points_earned?: number
          raw_payload?: Json | null
          region_code?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      partners: {
        Row: {
          approved: boolean
          business_name: string
          category: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          business_name: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          business_name?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymous_on_leaderboard: boolean
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          last_action_date: string | null
          region_code: string
          total_carbon_kg: number
          total_points: number
          updated_at: string
        }
        Insert: {
          anonymous_on_leaderboard?: boolean
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id: string
          last_action_date?: string | null
          region_code?: string
          total_carbon_kg?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          anonymous_on_leaderboard?: boolean
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_action_date?: string | null
          region_code?: string
          total_carbon_kg?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          code: string
          code_expires_at: string
          cost_points: number
          created_at: string
          id: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          code_expires_at: string
          cost_points: number
          created_at?: string
          id?: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          code_expires_at?: string
          cost_points?: number
          created_at?: string
          id?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          category: string
          cost_points: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          partner_id: string
          stock: number | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          cost_points: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          partner_id: string
          stock?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cost_points?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          partner_id?: string
          stock?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
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
      wallet_transactions: {
        Row: {
          created_at: string
          delta_points: number
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_points: number
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["txn_kind"]
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta_points?: number
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["txn_kind"]
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: never
        Returns: {
          carbon_kg: number
          handle: string
          points: number
          streak: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_type: "bike" | "walk" | "transit" | "utility_saving" | "food_waste"
      app_role: "admin" | "partner" | "user"
      redemption_status: "pending" | "used" | "expired" | "cancelled"
      txn_kind: "earn" | "redeem" | "adjust"
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
      action_type: ["bike", "walk", "transit", "utility_saving", "food_waste"],
      app_role: ["admin", "partner", "user"],
      redemption_status: ["pending", "used", "expired", "cancelled"],
      txn_kind: ["earn", "redeem", "adjust"],
    },
  },
} as const
