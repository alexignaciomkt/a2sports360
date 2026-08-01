export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      championships: {
        Row: {
          created_at: string | null
          format: string
          id: string
          modality: string
          name: string
          public_screen_token_hash: string | null
          source_system: string | null
          external_event_id: string | null
          status: string
          target_score: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          format: string
          id?: string
          modality?: string
          name: string
          public_screen_token_hash?: string | null
          source_system?: string | null
          external_event_id?: string | null
          status?: string
          target_score?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          format?: string
          id?: string
          modality?: string
          name?: string
          public_screen_token_hash?: string | null
          source_system?: string | null
          external_event_id?: string | null
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
          }
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
          }
        ]
      }
      match_events: {
        Row: {
          actor_id: string | null
          device_id: string | null
          event_type: string
          id: string
          match_id: string
          metadata: Json | null
          points_delta: number
          sequence: number
          team_id: string | null
          timestamp: string | null
        }
        Insert: {
          actor_id?: string | null
          device_id?: string | null
          event_type: string
          id?: string
          match_id: string
          metadata?: Json | null
          points_delta: number
          sequence: number
          team_id?: string | null
          timestamp?: string | null
        }
        Update: {
          actor_id?: string | null
          device_id?: string | null
          event_type?: string
          id?: string
          match_id?: string
          metadata?: Json | null
          points_delta?: number
          sequence?: number
          team_id?: string | null
          timestamp?: string | null
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
          }
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
          }
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
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
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
          }
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
          }
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          external_source: string | null
          external_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          external_source?: string | null
          external_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          external_source?: string | null
          external_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
