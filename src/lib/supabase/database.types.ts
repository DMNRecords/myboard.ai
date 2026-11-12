export type Database = {
  public: {
    Tables: {
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
