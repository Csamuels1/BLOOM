export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      analytics_event_types: {
        Row: {
          description: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          name: string;
        };
        Update: {
          description?: string;
          name?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          event_name: string;
          id: string;
          occurred_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          event_name: string;
          id?: string;
          occurred_at?: string;
          user_id?: string | null;
        };
        Update: {
          event_name?: string;
          id?: string;
          occurred_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_event_name_fkey';
            columns: ['event_name'];
            isOneToOne: false;
            referencedRelation: 'analytics_event_types';
            referencedColumns: ['name'];
          },
        ];
      };
      community_posts: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cycle_logs: {
        Row: {
          created_at: string;
          id: string;
          started_on: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          started_on: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          started_on?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          allergens: string[];
          author: string | null;
          calories_max: number;
          calories_min: number;
          carbs_g: number | null;
          created_at: string;
          dietary_tags: string[];
          fat_g: number | null;
          goals: string[];
          id: string;
          ingredients: string[];
          is_active: boolean;
          name: string;
          protein_g: number | null;
          region: string;
          review_status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          slot: string | null;
          source: string | null;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          allergens?: string[];
          author?: string | null;
          calories_max: number;
          calories_min: number;
          carbs_g?: number | null;
          created_at?: string;
          dietary_tags?: string[];
          fat_g?: number | null;
          goals?: string[];
          id?: string;
          ingredients?: string[];
          is_active?: boolean;
          name: string;
          protein_g?: number | null;
          region: string;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slot?: string | null;
          source?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          allergens?: string[];
          author?: string | null;
          calories_max?: number;
          calories_min?: number;
          carbs_g?: number | null;
          created_at?: string;
          dietary_tags?: string[];
          fat_g?: number | null;
          goals?: string[];
          id?: string;
          ingredients?: string[];
          is_active?: boolean;
          name?: string;
          protein_g?: number | null;
          region?: string;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slot?: string | null;
          source?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      moderation_actions: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          moderator_id: string;
          reason: string | null;
          target_id: string;
          target_type: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          moderator_id: string;
          reason?: string | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          moderator_id?: string;
          reason?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [];
      };
      post_reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reaction: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reaction?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reaction?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_reactions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      post_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id?: string;
          reason?: string;
          reporter_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          age_confirmed: boolean;
          allergens: string[];
          country_code: string | null;
          created_at: string;
          dietary_preferences: string[];
          feeding_context: string | null;
          goal: string;
          height_cm: number | null;
          id: string;
          onboarding_completed_at: string | null;
          postpartum_months: number | null;
          postpartum_status: string | null;
          track_cycle: boolean;
          unit_system: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          age_confirmed?: boolean;
          allergens?: string[];
          country_code?: string | null;
          created_at?: string;
          dietary_preferences?: string[];
          feeding_context?: string | null;
          goal: string;
          height_cm?: number | null;
          id: string;
          onboarding_completed_at?: string | null;
          postpartum_months?: number | null;
          postpartum_status?: string | null;
          track_cycle?: boolean;
          unit_system?: string;
          updated_at?: string;
        };
        Update: {
          age_confirmed?: boolean;
          allergens?: string[];
          country_code?: string | null;
          created_at?: string;
          dietary_preferences?: string[];
          feeding_context?: string | null;
          goal?: string;
          height_cm?: number | null;
          id?: string;
          onboarding_completed_at?: string | null;
          postpartum_months?: number | null;
          postpartum_status?: string | null;
          track_cycle?: boolean;
          unit_system?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          source: string;
          status: string;
          tier: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          source?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          source?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      support_resources: {
        Row: {
          category: string;
          contact_phone: string | null;
          contact_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          region: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          updated_at: string;
          verified: boolean;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          contact_phone?: string | null;
          contact_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          region: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          updated_at?: string;
          verified?: boolean;
          version?: number;
        };
        Update: {
          category?: string;
          contact_phone?: string | null;
          contact_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          region?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          updated_at?: string;
          verified?: boolean;
          version?: number;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weight_measurements: {
        Row: {
          created_at: string;
          id: string;
          measured_at: string;
          note: string | null;
          user_id: string;
          weight_kg: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          note?: string | null;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          note?: string | null;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_current_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      export_current_user: { Args: Record<PropertyKey, never>; Returns: Json };
      is_moderator: { Args: Record<PropertyKey, never>; Returns: boolean };
      persist_onboarding: {
        Args: { p: Json };
        Returns: {
          age_confirmed: boolean;
          allergens: string[];
          country_code: string | null;
          created_at: string;
          dietary_preferences: string[];
          feeding_context: string | null;
          goal: string;
          height_cm: number | null;
          id: string;
          onboarding_completed_at: string | null;
          postpartum_months: number | null;
          postpartum_status: string | null;
          track_cycle: boolean;
          unit_system: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
