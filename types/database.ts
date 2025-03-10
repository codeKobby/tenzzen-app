export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail: string | null
          duration: string | null
          channel_id: string | null
          channel_name: string | null
          channel_avatar: string | null
          views: string | null
          likes: string | null
          publish_date: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          thumbnail?: string | null
          duration?: string | null
          channel_id?: string | null
          channel_name?: string | null
          channel_avatar?: string | null
          views?: string | null
          likes?: string | null
          publish_date?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail?: string | null
          duration?: string | null
          channel_id?: string | null
          channel_name?: string | null
          channel_avatar?: string | null
          views?: string | null
          likes?: string | null
          publish_date?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Add any views here if needed
    }
    Functions: {
      requesting_user_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      handle_updated_at: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      // Add any enums here if needed
    }
  }
  clerk: {
    Tables: {
      // These are foreign tables, so we don't need Insert/Update types
      users: {
        Row: {
          id: string
          external_id: string | null
          username: string | null
          first_name: string | null
          last_name: string | null
          created_at: string | null
          updated_at: string | null
          attrs: Record<string, any> | null
        }
      }
    }
    Views: {
      user_emails: {
        Row: {
          id: string
          email: string | null
        }
      }
    }
  }
}
