export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      form_field_options: {
        Row: {
          created_at: string | null
          display_order: number
          field_id: string
          id: string
          is_active: boolean | null
          option_label: string
          option_value: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          field_id: string
          id?: string
          is_active?: boolean | null
          option_label: string
          option_value: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          field_id?: string
          id?: string
          is_active?: boolean | null
          option_label?: string
          option_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_field_options_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
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
          conditional_logic: Json | null
          created_at: string | null
          default_value: string | null
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          form_id: string
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_length: number | null
          min_length: number | null
          pattern: string | null
          placeholder: string | null
          student_field_mapping: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          auto_populate_from?: string | null
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          display_order?: number
          field_label: string
          field_name: string
          field_type: string
          form_id: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_length?: number | null
          min_length?: number | null
          pattern?: string | null
          placeholder?: string | null
          student_field_mapping?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          auto_populate_from?: string | null
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          form_id?: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_length?: number | null
          min_length?: number | null
          pattern?: string | null
          placeholder?: string | null
          student_field_mapping?: string | null
          updated_at?: string | null
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
            foreignKeyName: "form_responses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          id: string
          is_required: boolean | null
          status: string | null
          submission_deadline: string | null
          target_role: string
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_multiple_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_type: string
          id?: string
          is_required?: boolean | null
          status?: string | null
          submission_deadline?: string | null
          target_role: string
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_multiple_submissions?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_type?: string
          id?: string
          is_required?: boolean | null
          status?: string | null
          submission_deadline?: string | null
          target_role?: string
          title?: string
          updated_at?: string | null
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
          role: string | null
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
          role?: string | null
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
          role?: string | null
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
          role: string
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
          role: string
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
          role?: string
          updated_at?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
