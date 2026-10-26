// Generated from the migrations with postgres-meta. Regenerate with `npm run db:types` after a schema change.

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
      accounts: {
        Row: {
          age_assurance: Database["public"]["Enums"]["verification_status"]
          age_assured_at: string | null
          ban_reason: string | null
          banned_at: string | null
          birth_date: string | null
          created_at: string
          display_name: string | null
          id: string
          id_verification: Database["public"]["Enums"]["verification_status"]
          id_verified_at: string | null
          role: Database["public"]["Enums"]["account_role"]
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          age_assurance?: Database["public"]["Enums"]["verification_status"]
          age_assured_at?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          id_verification?: Database["public"]["Enums"]["verification_status"]
          id_verified_at?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
        }
        Update: {
          age_assurance?: Database["public"]["Enums"]["verification_status"]
          age_assured_at?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          id_verification?: Database["public"]["Enums"]["verification_status"]
          id_verified_at?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        ComputedFields: never
        Insert: {
          blocked_id: string
          blocker_id?: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          last_message_at: string | null
          listing_id: string
          visitor_id: string
        }
        ComputedFields: never
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id: string
          visitor_id: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_advertiser_id_fkey"
            columns: ["advertiser_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_visitor_id_fkey"
            columns: ["visitor_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          is_locked: boolean
          listing_id: string
          position: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["photo_status"]
          storage_path: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_locked?: boolean
          listing_id: string
          position?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_locked?: boolean
          listing_id?: string
          position?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_reviewed_by_fkey"
            columns: ["reviewed_by"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          advertiser_id: string
          age: number
          approved_photo_count: number
          approx_lat: number | null
          approx_lng: number | null
          area: string
          availability: Database["public"]["Enums"]["availability"]
          bio: string
          created_at: string
          display_name: string
          id: string
          locked_photo_count: number
          moderation_note: string | null
          needs_review: boolean
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          tags: NonNullable<Json>
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          advertiser_id?: string
          age: number
          approved_photo_count?: number
          approx_lat?: number | null
          approx_lng?: number | null
          area: string
          availability?: Database["public"]["Enums"]["availability"]
          bio?: string
          created_at?: string
          display_name: string
          id?: string
          locked_photo_count?: number
          moderation_note?: string | null
          needs_review?: boolean
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: NonNullable<Json>
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          age?: number
          approved_photo_count?: number
          approx_lat?: number | null
          approx_lng?: number | null
          area?: string
          availability?: Database["public"]["Enums"]["availability"]
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          locked_photo_count?: number
          moderation_note?: string | null
          needs_review?: boolean
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: NonNullable<Json>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_advertiser_id_fkey"
            columns: ["advertiser_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: number
          read_at: string | null
          sender_id: string
        }
        ComputedFields: never
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: never
          read_at?: string | null
          sender_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: never
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          account_id: string | null
          action: string
          created_at: string
          id: number
          listing_id: string | null
          moderator_id: string | null
          note: string | null
          photo_id: string | null
          report_id: number | null
        }
        ComputedFields: never
        Insert: {
          account_id?: string | null
          action: string
          created_at?: string
          id?: never
          listing_id?: string | null
          moderator_id?: string | null
          note?: string | null
          photo_id?: string | null
          report_id?: number | null
        }
        Update: {
          account_id?: string | null
          action?: string
          created_at?: string
          id?: never
          listing_id?: string | null
          moderator_id?: string | null
          note?: string | null
          photo_id?: string | null
          report_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_log_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_moderator_id_fkey"
            columns: ["moderator_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_photo_id_fkey"
            columns: ["photo_id"]
            referencedRelation: "listing_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          details: string | null
          handled_at: string | null
          handled_by: string | null
          id: number
          listing_id: string | null
          message_id: number | null
          photo_id: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_account_id: string | null
          reporter_id: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["report_status"]
          urgent: boolean | null
        }
        ComputedFields: never
        Insert: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: never
          listing_id?: string | null
          message_id?: number | null
          photo_id?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_account_id?: string | null
          reporter_id?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          urgent?: never
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: never
          listing_id?: string | null
          message_id?: number | null
          photo_id?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_account_id?: string | null
          reporter_id?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          urgent?: never
        }
        Relationships: [
          {
            foreignKeyName: "reports_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_photo_id_fkey"
            columns: ["photo_id"]
            referencedRelation: "listing_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_account_id_fkey"
            columns: ["reported_account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist: {
        Row: {
          account_id: string
          created_at: string
          listing_id: string
        }
        ComputedFields: never
        Insert: {
          account_id?: string
          created_at?: string
          listing_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_checks: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          id: string
          kind: Database["public"]["Enums"]["check_kind"]
          provider: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        ComputedFields: never
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          kind: Database["public"]["Enums"]["check_kind"]
          provider: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["check_kind"]
          provider?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verification_checks_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_verification_check: {
        Args: {
          p_account_id: string
          p_kind: Database["public"]["Enums"]["check_kind"]
          p_provider: string
        }
        Returns: string
      }
      complete_verification_check: {
        Args: {
          p_birth_date?: string
          p_check_id: string
          p_failure_reason?: string
          p_passed: boolean
          p_provider_ref?: string
        }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      my_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          blocked: boolean
          conversation_id: string
          is_advertiser: boolean
          last_message: string
          last_message_at: string
          last_message_from_me: boolean
          listing_id: string
          listing_slug: string
          partner_id: string
          partner_name: string
          unread_count: number
        }[]
      }
      resolve_report: {
        Args: {
          p_note?: string
          p_report_id: number
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      review_listing: {
        Args: { p_approve: boolean; p_listing_id: string; p_note?: string }
        Returns: undefined
      }
      review_photo: {
        Args: { p_approve: boolean; p_photo_id: string; p_reason?: string }
        Returns: undefined
      }
      set_account_ban: {
        Args: { p_account_id: string; p_banned: boolean; p_reason?: string }
        Returns: undefined
      }
      start_conversation: { Args: { p_listing_id: string }; Returns: string }
      submit_listing_for_review: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      submit_report: {
        Args: {
          p_details?: string
          p_listing_id?: string
          p_message_id?: number
          p_photo_id?: string
          p_reason: Database["public"]["Enums"]["report_reason"]
        }
        Returns: number
      }
    }
    Enums: {
      account_role: "visitor" | "advertiser" | "moderator" | "admin"
      availability: "available" | "away" | "offline"
      check_kind: "id_verification" | "age_assurance"
      listing_status:
        | "draft"
        | "pending_review"
        | "published"
        | "rejected"
        | "suspended"
      photo_status: "pending" | "approved" | "rejected"
      report_reason:
        | "underage"
        | "coercion_or_trafficking"
        | "not_the_person"
        | "scam"
        | "harassment"
        | "spam"
        | "other"
      report_status: "open" | "actioned" | "dismissed"
      verification_status: "none" | "pending" | "passed" | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_role: ["visitor", "advertiser", "moderator", "admin"],
      availability: ["available", "away", "offline"],
      check_kind: ["id_verification", "age_assurance"],
      listing_status: [
        "draft",
        "pending_review",
        "published",
        "rejected",
        "suspended",
      ],
      photo_status: ["pending", "approved", "rejected"],
      report_reason: [
        "underage",
        "coercion_or_trafficking",
        "not_the_person",
        "scam",
        "harassment",
        "spam",
        "other",
      ],
      report_status: ["open", "actioned", "dismissed"],
      verification_status: ["none", "pending", "passed", "failed"],
    },
  },
} as const
