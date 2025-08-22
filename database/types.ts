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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      features: {
        Row: {
          display_name: string | null
          id: number
          name: string | null
          uri: string | null
        }
        Insert: {
          display_name?: string | null
          id?: number
          name?: string | null
          uri?: string | null
        }
        Update: {
          display_name?: string | null
          id?: number
          name?: string | null
          uri?: string | null
        }
        Relationships: []
      }
      form_field_options: {
        Row: {
          column_label: string | null
          created_at: string | null
          display_order: number
          field_id: string
          grid_position: Json | null
          id: string
          is_active: boolean | null
          jump_to_section_id: string | null
          option_label: string
          option_type: string | null
          option_value: string
          row_label: string | null
        }
        Insert: {
          column_label?: string | null
          created_at?: string | null
          display_order?: number
          field_id: string
          grid_position?: Json | null
          id?: string
          is_active?: boolean | null
          jump_to_section_id?: string | null
          option_label: string
          option_type?: string | null
          option_value: string
          row_label?: string | null
        }
        Update: {
          column_label?: string | null
          created_at?: string | null
          display_order?: number
          field_id?: string
          grid_position?: Json | null
          id?: string
          is_active?: boolean | null
          jump_to_section_id?: string | null
          option_label?: string
          option_type?: string | null
          option_value?: string
          row_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_options_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_options_jump_to_section_id_fkey"
            columns: ["jump_to_section_id"]
            isOneToOne: false
            referencedRelation: "form_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_responses: {
        Row: {
          created_at: string | null
          field_id: string
          field_value: string | null
          field_values: Json | null
          id: string
          response_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          field_value?: string | null
          field_values?: Json | null
          id?: string
          response_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          field_value?: string | null
          field_values?: Json | null
          id?: string
          response_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_responses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_responses_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          auto_populate_from: string | null
          created_at: string | null
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          form_id: string
          form_section_id: string
          help_image_url: string | null
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_length: number | null
          min_length: number | null
          placeholder: string | null
          student_field_mapping: string | null
          updated_at: string | null
          upload_folder_id: string | null
          validation_rules: Json | null
        }
        Insert: {
          auto_populate_from?: string | null
          created_at?: string | null
          display_order?: number
          field_label: string
          field_name: string
          field_type: string
          form_id: string
          form_section_id: string
          help_image_url?: string | null
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_length?: number | null
          min_length?: number | null
          placeholder?: string | null
          student_field_mapping?: string | null
          updated_at?: string | null
          upload_folder_id?: string | null
          validation_rules?: Json | null
        }
        Update: {
          auto_populate_from?: string | null
          created_at?: string | null
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          form_id?: string
          form_section_id?: string
          help_image_url?: string | null
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_length?: number | null
          min_length?: number | null
          placeholder?: string | null
          student_field_mapping?: string | null
          updated_at?: string | null
          upload_folder_id?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_form_section_id_fkey"
            columns: ["form_section_id"]
            isOneToOne: false
            referencedRelation: "form_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          created_at: string | null
          form_id: string
          id: string
          metadata: Json | null
          respondent_id: string | null
          respondent_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submission_status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          id?: string
          metadata?: Json | null
          respondent_id?: string | null
          respondent_type: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          id?: string
          metadata?: Json | null
          respondent_id?: string | null
          respondent_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_sections: {
        Row: {
          created_at: string
          description: string | null
          form_id: string
          id: string
          order: number
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_id: string
          id?: string
          order?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          form_id?: string
          id?: string
          order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_sections_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system_template: boolean | null
          name: string
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name: string
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          allow_multiple_submissions: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          form_type: string
          help_image_folder_id: string | null
          id: string
          is_required: boolean | null
          status: string | null
          submission_deadline: string | null
          title: string
          updated_at: string | null
          upload_folders_folder_id: string | null
        }
        Insert: {
          allow_multiple_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_type: string
          help_image_folder_id?: string | null
          id?: string
          is_required?: boolean | null
          status?: string | null
          submission_deadline?: string | null
          title: string
          updated_at?: string | null
          upload_folders_folder_id?: string | null
        }
        Update: {
          allow_multiple_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_type?: string
          help_image_folder_id?: string | null
          id?: string
          is_required?: boolean | null
          status?: string | null
          submission_deadline?: string | null
          title?: string
          updated_at?: string | null
          upload_folders_folder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          access_type: string
          feature_id: number | null
          role_id: number | null
        }
        Insert: {
          access_type?: string
          feature_id?: number | null
          role_id?: number | null
        }
        Update: {
          access_type?: string
          feature_id?: number | null
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          display_name: string | null
          id: number
          is_active: boolean
          name: string
          order: number
        }
        Insert: {
          color?: string | null
          display_name?: string | null
          id?: number
          is_active?: boolean
          name: string
          order?: number
        }
        Update: {
          color?: string | null
          display_name?: string | null
          id?: number
          is_active?: boolean
          name?: string
          order?: number
        }
        Relationships: []
      }
      students: {
        Row: {
          account_password: string | null
          account_username: string | null
          additional_info: Json | null
          class: string
          created_at: string
          cultural_disadvantage_factors: string | null
          email: string | null
          family_background: string | null
          gender: string
          grade: string
          id: string
          is_disadvantaged: string
          name: string
          personal_background_notes: string | null
          region: string | null
          registration_motivation: string | null
          student_type: string
          updated_at: string
        }
        Insert: {
          account_password?: string | null
          account_username?: string | null
          additional_info?: Json | null
          class: string
          created_at?: string
          cultural_disadvantage_factors?: string | null
          email?: string | null
          family_background?: string | null
          gender: string
          grade: string
          id?: string
          is_disadvantaged: string
          name: string
          personal_background_notes?: string | null
          region?: string | null
          registration_motivation?: string | null
          student_type: string
          updated_at?: string
        }
        Update: {
          account_password?: string | null
          account_username?: string | null
          additional_info?: Json | null
          class?: string
          created_at?: string
          cultural_disadvantage_factors?: string | null
          email?: string | null
          family_background?: string | null
          gender?: string
          grade?: string
          id?: string
          is_disadvantaged?: string
          name?: string
          personal_background_notes?: string | null
          region?: string | null
          registration_motivation?: string | null
          student_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_student_access: {
        Row: {
          created_at: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_access_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_access_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_form_access: {
        Row: {
          access_type: string | null
          expires_at: string | null
          form_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role_id: number | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          expires_at?: string | null
          form_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: number | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          expires_at?: string | null
          form_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_form_access_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_form_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_form_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_form_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string | null
          last_active: string | null
          name: string | null
          region: string | null
          role_id: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string | null
          last_active?: string | null
          name?: string | null
          region?: string | null
          role_id?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string | null
          last_active?: string | null
          name?: string | null
          region?: string | null
          role_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
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
