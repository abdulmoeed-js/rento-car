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
      bookings: {
        Row: {
          car_id: string
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_images: {
        Row: {
          car_id: string
          created_at: string
          id: string
          image_path: string
          is_primary: boolean
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          image_path: string
          is_primary?: boolean
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          image_path?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          available_days: string[] | null
          available_hours: Json | null
          brand: string
          cancellation_policy: string | null
          car_type: string
          created_at: string
          custom_availability: Json[] | null
          description: string
          doors: number | null
          fuel_type: string
          has_ac: boolean | null
          host_id: string
          id: string
          license_plate: string | null
          location: string
          location_coordinates: unknown | null
          model: string
          multi_day_discount: number | null
          pickup_instructions: string | null
          price_per_day: number
          transmission: string
          updated_at: string
          year: number
        }
        Insert: {
          available_days?: string[] | null
          available_hours?: Json | null
          brand: string
          cancellation_policy?: string | null
          car_type: string
          created_at?: string
          custom_availability?: Json[] | null
          description: string
          doors?: number | null
          fuel_type: string
          has_ac?: boolean | null
          host_id: string
          id?: string
          license_plate?: string | null
          location: string
          location_coordinates?: unknown | null
          model: string
          multi_day_discount?: number | null
          pickup_instructions?: string | null
          price_per_day: number
          transmission: string
          updated_at?: string
          year: number
        }
        Update: {
          available_days?: string[] | null
          available_hours?: Json | null
          brand?: string
          cancellation_policy?: string | null
          car_type?: string
          created_at?: string
          custom_availability?: Json[] | null
          description?: string
          doors?: number | null
          fuel_type?: string
          has_ac?: boolean | null
          host_id?: string
          id?: string
          license_plate?: string | null
          location?: string
          location_coordinates?: unknown | null
          model?: string
          multi_day_discount?: number | null
          pickup_instructions?: string | null
          price_per_day?: number
          transmission?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      host_ratings: {
        Row: {
          comment: string | null
          created_at: string
          host_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          host_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          host_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      kyc_review_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_status: string
          previous_status: string
          reason: string | null
          reviewer_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_status: string
          previous_status: string
          reason?: string | null
          reviewer_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string
          reason?: string | null
          reviewer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          license_image_url: string | null
          license_status: string | null
          license_uploaded_at: string | null
          phone_number: string | null
          user_role: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          license_image_url?: string | null
          license_status?: string | null
          license_uploaded_at?: string | null
          phone_number?: string | null
          user_role?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          license_image_url?: string | null
          license_status?: string | null
          license_uploaded_at?: string | null
          phone_number?: string | null
          user_role?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      make_admin: {
        Args: { _email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
