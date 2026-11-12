export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      game_moderation_events: {
        Row: {
          created_at: string;
          id: string;
          owner_id: string;
          project_id: string;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          owner_id: string;
          project_id: string;
          reason: string;
        };
        Update: never;
        Relationships: [];
      };
      game_ai_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          owner_id: string;
          project_id: string;
          role: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          owner_id: string;
          project_id: string;
          role: string;
        };
        Update: never;
        Relationships: [];
      };
      game_versions: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          owner_id: string;
          project_id: string;
          version: number;
        };
        Insert: {
          content: Json;
          created_at?: string;
          id?: string;
          owner_id: string;
          project_id: string;
          version: number;
        };
        Update: never;
        Relationships: [];
      };
      game_projects: {
        Row: {
          archived_at: string | null;
          created_at: string;
          description: string | null;
          id: string;
          language: string;
          owner_id: string;
          status: string;
          style: string | null;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          language: string;
          owner_id: string;
          status?: string;
          style?: string | null;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          language?: string;
          owner_id?: string;
          status?: string;
          style?: string | null;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
