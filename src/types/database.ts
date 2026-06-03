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
      plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          price_yearly: number
          features: string[]
          is_featured: boolean
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'user' | 'admin'
          plan_id: string | null
          bio: string | null
          location_city: string | null
          social_links: { instagram: string; twitter: string; strava: string }
          accessibility_settings: AccessibilitySettings
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'cancelled' | 'past_due' | 'trialing'
          current_period_end: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      gyms: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          phone: string
          website: string | null
          rating: number
          amenities: string[]
          photos: string[]
          verified: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gyms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['gyms']['Insert']>
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          scheduled_at: string
          duration_minutes: number
          type: string
          reminder_sent: boolean
          color: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          media_urls: string[]
          likes_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_likes']['Row'], 'id' | 'created_at'>
        Update: never
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      ai_chat_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_chat_messages']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'normal' | 'large' | 'xlarge'
  highContrast: boolean
  reduceMotion: boolean
  textSpacing: boolean
  enhancedFocus: boolean
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  largeCursor: boolean
}

export type User = Database['public']['Tables']['users']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type Gym = Database['public']['Tables']['gyms']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostComment = Database['public']['Tables']['post_comments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type AiChatMessage = Database['public']['Tables']['ai_chat_messages']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
