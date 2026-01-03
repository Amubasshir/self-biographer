export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'user' | 'pro' | 'agency' | 'admin';
export type SubscriptionPlan = 'free' | 'pro' | 'agency';
export type ProfileType = 'person' | 'organization' | 'brand';
export type BioType = 'short' | 'medium' | 'long' | 'linkedin' | 'speaker' | 'press' | 'x_bio' | 'facebook_bio';
export type BioTone = 'professional' | 'friendly' | 'formal' | 'casual' | 'academic' | 'storytelling';
export type SchemaType = 'Person' | 'Organization' | 'Product' | 'Article' | 'WebPage';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
          subscription_plan: SubscriptionPlan;
          profile_limit: number;
          profile_count: number;
          paypal_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: SubscriptionPlan;
          profile_limit?: number;
          profile_count?: number;
          paypal_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: SubscriptionPlan;
          profile_limit?: number;
          profile_count?: number;
          paypal_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          created_at?: string;
        };
      };
      bio_profiles: {
        Row: {
          id: string;
          owner_id: string;
          type: ProfileType;
          name: string;
          job_title: string | null;
          website: string | null;
          bio_notes: string | null;
          social_links: Json;
          slug: string | null;
          main_image: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type?: ProfileType;
          name: string;
          job_title?: string | null;
          website?: string | null;
          bio_notes?: string | null;
          social_links?: Json;
          slug?: string | null;
          main_image?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          type?: ProfileType;
          name?: string;
          job_title?: string | null;
          website?: string | null;
          bio_notes?: string | null;
          social_links?: Json;
          slug?: string | null;
          main_image?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      biographies: {
        Row: {
          id: string;
          profile_id: string;
          bio_type: BioType;
          content: string | null;
          tone: BioTone;
          is_locked: boolean;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio_type: BioType;
          content?: string | null;
          tone?: BioTone;
          is_locked?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          bio_type?: BioType;
          content?: string | null;
          tone?: BioTone;
          is_locked?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schema_snippets: {
        Row: {
          id: string;
          profile_id: string;
          schema_type: SchemaType;
          schema_text: string | null;
          validated: boolean;
          validation_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          schema_type?: SchemaType;
          schema_text?: string | null;
          validated?: boolean;
          validation_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          schema_type?: SchemaType;
          schema_text?: string | null;
          validated?: boolean;
          validation_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      press_kits: {
        Row: {
          id: string;
          profile_id: string;
          slug: string | null;
          include_short_bio: boolean;
          include_long_bio: boolean;
          include_images: boolean;
          include_contacts: boolean;
          is_published: boolean;
          views_count: number;
          downloads_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          slug?: string | null;
          include_short_bio?: boolean;
          include_long_bio?: boolean;
          include_images?: boolean;
          include_contacts?: boolean;
          is_published?: boolean;
          views_count?: number;
          downloads_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          slug?: string | null;
          include_short_bio?: boolean;
          include_long_bio?: boolean;
          include_images?: boolean;
          include_contacts?: boolean;
          is_published?: boolean;
          views_count?: number;
          downloads_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          template_type: string;
          name: string;
          content: string | null;
          tone: BioTone | null;
          premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_type: string;
          name: string;
          content?: string | null;
          tone?: BioTone | null;
          premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_type?: string;
          name?: string;
          content?: string | null;
          tone?: BioTone | null;
          premium?: boolean;
          created_at?: string;
        };
      };
      ai_request_logs: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string | null;
          action: string;
          tokens_used: number;
          raw_prompt: string | null;
          response_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id?: string | null;
          action: string;
          tokens_used?: number;
          raw_prompt?: string | null;
          response_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string | null;
          action?: string;
          tokens_used?: number;
          raw_prompt?: string | null;
          response_summary?: string | null;
          created_at?: string;
        };
      };
      billing_history: {
        Row: {
          id: string;
          user_id: string;
          amount: number | null;
          currency: string;
          description: string | null;
          paypal_transaction_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: number | null;
          currency?: string;
          description?: string | null;
          paypal_transaction_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number | null;
          currency?: string;
          description?: string | null;
          paypal_transaction_id?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      profile_analytics: {
        Row: {
          id: string;
          profile_id: string;
          view_date: string;
          views_count: number;
          unique_visitors: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          view_date?: string;
          views_count?: number;
          unique_visitors?: number;
        };
        Update: {
          id?: string;
          profile_id?: string;
          view_date?: string;
          views_count?: number;
          unique_visitors?: number;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      get_user_role: {
        Args: { _user_id: string };
        Returns: AppRole;
      };
      generate_slug: {
        Args: { name: string };
        Returns: string;
      };
      increment_profile_view: {
        Args: { p_profile_id: string };
        Returns: void;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type BioProfile = Database['public']['Tables']['bio_profiles']['Row'];
export type Biography = Database['public']['Tables']['biographies']['Row'];
export type SchemaSnippet = Database['public']['Tables']['schema_snippets']['Row'];
export type PressKit = Database['public']['Tables']['press_kits']['Row'];
export type Template = Database['public']['Tables']['templates']['Row'];
export type AIRequestLog = Database['public']['Tables']['ai_request_logs']['Row'];
export type BillingHistory = Database['public']['Tables']['billing_history']['Row'];
