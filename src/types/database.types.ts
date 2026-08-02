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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      championships: {
        Row: {
          created_at: string | null
          external_event_id: string | null
          format: string
          id: string
          metadata: Json | null
          modality: string
          name: string
          public_screen_token_hash: string | null
          source_system: string | null
          starts_at: string | null
          status: string
          target_score: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_event_id?: string | null
          format: string
          id?: string
          metadata?: Json | null
          modality?: string
          name: string
          public_screen_token_hash?: string | null
          source_system?: string | null
          starts_at?: string | null
          status?: string
          target_score?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_event_id?: string | null
          format?: string
          id?: string
          metadata?: Json | null
          modality?: string
          name?: string
          public_screen_token_hash?: string | null
          source_system?: string | null
          starts_at?: string | null
          status?: string
          target_score?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "championships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      game_tables: {
        Row: {
          championship_id: string
          current_match_id: string | null
          id: string
          number: number
          qr_token: string
          status: string
        }
        Insert: {
          championship_id: string
          current_match_id?: string | null
          id?: string
          number: number
          qr_token: string
          status?: string
        }
        Update: {
          championship_id?: string
          current_match_id?: string | null
          id?: string
          number?: number
          qr_token?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_match"
            columns: ["current_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_tables_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          device_id: string | null
          event_type: string
          id: string
          match_id: string
          metadata: Json | null
          points_delta: number
          sequence: number
          team_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          device_id?: string | null
          event_type: string
          id?: string
          match_id: string
          metadata?: Json | null
          points_delta: number
          sequence: number
          team_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          device_id?: string | null
          event_type?: string
          id?: string
          match_id?: string
          metadata?: Json | null
          points_delta?: number
          sequence?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          match_id: string
          role: string
          session_token_hash: string
          status: string
          table_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          match_id: string
          role?: string
          session_token_hash: string
          status?: string
          table_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          match_id?: string
          role?: string
          session_token_hash?: string
          status?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_sessions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          championship_id: string
          finished_at: string | null
          id: string
          started_at: string | null
          status: string
          table_id: string
          team_a_id: string
          team_a_score: number
          team_b_id: string
          team_b_score: number
          winner_team_id: string | null
        }
        Insert: {
          championship_id: string
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          table_id: string
          team_a_id: string
          team_a_score?: number
          team_b_id: string
          team_b_score?: number
          winner_team_id?: string | null
        }
        Update: {
          championship_id?: string
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          table_id?: string
          team_a_id?: string
          team_a_score?: number
          team_b_id?: string
          team_b_score?: number
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          player_id: string
          position: number
          team_id: string
        }
        Insert: {
          player_id: string
          position: number
          team_id: string
        }
        Update: {
          player_id?: string
          position?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          championship_id: string
          id: string
          name: string
          status: string
        }
        Insert: {
          championship_id: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          championship_id?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_mappings: {
        Row: {
          created_at: string | null
          external_tenant_id: string
          id: string
          metadata: Json | null
          source_system: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_tenant_id: string
          id?: string
          metadata?: Json | null
          source_system: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_tenant_id?: string
          id?: string
          metadata?: Json | null
          source_system?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          external_id: string | null
          external_source: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_match_event: {
        Args: {
          p_device_id: string
          p_event_type: string
          p_match_id: string
          p_metadata: Json
          p_points_delta: number
          p_session_token_hash: string
          p_team_id: string
        }
        Returns: Json
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
