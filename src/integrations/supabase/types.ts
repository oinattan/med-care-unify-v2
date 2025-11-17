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
      channels: {
        Row: {
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["channel_type"]
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["channel_type"]
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["channel_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_to: string | null
          channel_id: string | null
          closed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          patient_id: string | null
          priority: number | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_channels: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_username: string
          updated_at: string
          use_tls: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          smtp_host: string
          smtp_password: string
          smtp_port?: number
          smtp_username: string
          updated_at?: string
          use_tls?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_username?: string
          updated_at?: string
          use_tls?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_from_patient: boolean | null
          message_type: string | null
          metadata: Json | null
          sender_id: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_from_patient?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_from_patient?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string | null
          document_number: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      channel_type: "whatsapp" | "email" | "sms" | "webchat"
      conversation_status: "open" | "closed" | "pending"
      message_status: "sent" | "delivered" | "read" | "failed"
      user_role: "attendant" | "manager" | "admin"
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
      channel_type: ["whatsapp", "email", "sms", "webchat"],
      conversation_status: ["open", "closed", "pending"],
      message_status: ["sent", "delivered", "read", "failed"],
      user_role: ["attendant", "manager", "admin"],
    },
  },
} as const
