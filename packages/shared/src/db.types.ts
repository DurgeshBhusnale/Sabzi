
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "action_log": {
                  Row: {
                    "action": string,"client_id": string,"created_at": string,"result": NonNullable<Json>,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"client_id": string,"created_at"?: string,"result"?: NonNullable<Json>,"user_id": string
                  }
                  Update: {
                    "action"?: string,"client_id"?: string,"created_at"?: string,"result"?: NonNullable<Json>,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "action_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"app_opens": {
                  Row: {
                    "date": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "date": string,"user_id": string
                  }
                  Update: {
                    "date"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_opens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"app_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"buyer_societies": {
                  Row: {
                    "buyer_id": string,"created_at": string,"is_primary": boolean,"society_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_id": string,"created_at"?: string,"is_primary"?: boolean,"society_id": string
                  }
                  Update: {
                    "buyer_id"?: string,"created_at"?: string,"is_primary"?: boolean,"society_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "buyer_societies_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "buyer_societies_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "buyer_societies_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "buyer_societies_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    }
                  ]
                },"daily_menus": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"published_at": string | null,"stock_photo_at": string | null,"stock_photo_path": string | null,"updated_at": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"id"?: string,"published_at"?: string | null,"stock_photo_at"?: string | null,"stock_photo_path"?: string | null,"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"published_at"?: string | null,"stock_photo_at"?: string | null,"stock_photo_path"?: string | null,"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_menus_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_menus_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"deals": {
                  Row: {
                    "client_id": string | null,"created_at": string,"date": string,"id": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"date": string,"id"?: string,"vendor_id": string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"date"?: string,"id"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deals_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deals_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "buyer_id": string,"created_at": string,"notify_arrival": boolean,"notify_deals": boolean,"notify_requests": boolean,"society_id": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_id": string,"created_at"?: string,"notify_arrival"?: boolean,"notify_deals"?: boolean,"notify_requests"?: boolean,"society_id": string,"vendor_id": string
                  }
                  Update: {
                    "buyer_id"?: string,"created_at"?: string,"notify_arrival"?: boolean,"notify_deals"?: boolean,"notify_requests"?: boolean,"society_id"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "follows_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "follows_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "follows_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"gates": {
                  Row: {
                    "created_at": string,"id": string,"lat": number,"lng": number,"name": string,"society_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"lat": number,"lng": number,"name": string,"society_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"lat"?: number,"lng"?: number,"name"?: string,"society_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gates_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gates_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "gates_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    }
                  ]
                },"items": {
                  Row: {
                    "approved": boolean,"created_at": string,"created_by": string | null,"default_unit": Database["public"]['Enums']["price_unit"],"id": string,"image_path": string | null,"is_custom": boolean,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved"?: boolean,"created_at"?: string,"created_by"?: string | null,"default_unit"?: Database["public"]['Enums']["price_unit"],"id"?: string,"image_path"?: string | null,"is_custom"?: boolean,"name": string
                  }
                  Update: {
                    "approved"?: boolean,"created_at"?: string,"created_by"?: string | null,"default_unit"?: Database["public"]['Enums']["price_unit"],"id"?: string,"image_path"?: string | null,"is_custom"?: boolean,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"menu_items": {
                  Row: {
                    "deal_at": string | null,"deal_price": number | null,"is_sold_out": boolean,"item_id": string,"menu_id": string,"price": number,"sort": number,"unit": Database["public"]['Enums']["price_unit"]
                  }
                  ComputedFields: never
                  Insert: {
                    "deal_at"?: string | null,"deal_price"?: number | null,"is_sold_out"?: boolean,"item_id": string,"menu_id": string,"price": number,"sort"?: number,"unit": Database["public"]['Enums']["price_unit"]
                  }
                  Update: {
                    "deal_at"?: string | null,"deal_price"?: number | null,"is_sold_out"?: boolean,"item_id"?: string,"menu_id"?: string,"price"?: number,"sort"?: number,"unit"?: Database["public"]['Enums']["price_unit"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_items_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_items_menu_id_fkey"
      columns: ["menu_id"]
isOneToOne: false
      referencedRelation: "daily_menus"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"opened_at": string | null,"payload": NonNullable<Json>,"sent_at": string,"type": Database["public"]['Enums']["notif_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"opened_at"?: string | null,"payload"?: NonNullable<Json>,"sent_at"?: string,"type": Database["public"]['Enums']["notif_type"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"opened_at"?: string | null,"payload"?: NonNullable<Json>,"sent_at"?: string,"type"?: Database["public"]['Enums']["notif_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"otp_attempts": {
                  Row: {
                    "blocked_until": string | null,"failures": number,"first_failure_at": string | null,"phone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_until"?: string | null,"failures"?: number,"first_failure_at"?: string | null,"phone": string,"updated_at"?: string
                  }
                  Update: {
                    "blocked_until"?: string | null,"failures"?: number,"first_failure_at"?: string | null,"phone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "admin_active": boolean,"admin_level": Database["public"]['Enums']["admin_level"] | null,"created_at": string,"deleted_at": string | null,"email": string | null,"email_verified": boolean,"name": string | null,"notify_prefs": NonNullable<Json>,"push_token": string | null,"role": Database["public"]['Enums']["user_role"] | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_active"?: boolean,"admin_level"?: Database["public"]['Enums']["admin_level"] | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"email_verified"?: boolean,"name"?: string | null,"notify_prefs"?: NonNullable<Json>,"push_token"?: string | null,"role"?: Database["public"]['Enums']["user_role"] | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "admin_active"?: boolean,"admin_level"?: Database["public"]['Enums']["admin_level"] | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"email_verified"?: boolean,"name"?: string | null,"notify_prefs"?: NonNullable<Json>,"push_token"?: string | null,"role"?: Database["public"]['Enums']["user_role"] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"qr_scans": {
                  Row: {
                    "created_at": string,"id": number,"society_id": string | null,"source": string,"vendor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"society_id"?: string | null,"source": string,"vendor_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"society_id"?: string | null,"source"?: string,"vendor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "qr_scans_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "qr_scans_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "qr_scans_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "qr_scans_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "qr_scans_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"photo_path": string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string,"resolution_note": string | null,"status": Database["public"]['Enums']["report_status"],"text": string | null,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"photo_path"?: string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string,"resolution_note"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"text"?: string | null,"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"photo_path"?: string | null,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_id"?: string,"resolution_note"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"text"?: string | null,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "reports_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"requests": {
                  Row: {
                    "answered_at": string | null,"buyer_id": string,"created_at": string,"for_date": string,"free_text": string | null,"id": string,"item_id": string | null,"note": string | null,"qty": string | null,"society_id": string,"status": Database["public"]['Enums']["request_status"],"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answered_at"?: string | null,"buyer_id": string,"created_at"?: string,"for_date": string,"free_text"?: string | null,"id"?: string,"item_id"?: string | null,"note"?: string | null,"qty"?: string | null,"society_id": string,"status"?: Database["public"]['Enums']["request_status"],"vendor_id": string
                  }
                  Update: {
                    "answered_at"?: string | null,"buyer_id"?: string,"created_at"?: string,"for_date"?: string,"free_text"?: string | null,"id"?: string,"item_id"?: string | null,"note"?: string | null,"qty"?: string | null,"society_id"?: string,"status"?: Database["public"]['Enums']["request_status"],"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "requests_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "requests_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requests_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requests_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "requests_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "requests_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requests_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"review_flags": {
                  Row: {
                    "created_at": string,"id": string,"reason": string,"review_id": string,"status": Database["public"]['Enums']["report_status"],"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason": string,"review_id": string,"status"?: Database["public"]['Enums']["report_status"],"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string,"review_id"?: string,"status"?: Database["public"]['Enums']["report_status"],"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_flags_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_flags_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "v_review_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_flags_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_flags_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "buyer_id": string,"created_at": string,"hidden_reason": string | null,"id": string,"stars": number,"status": Database["public"]['Enums']["review_status"],"tags": (string)[],"text": string | null,"updated_at": string,"vendor_id": string,"vendor_replied_at": string | null,"vendor_reply": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_id": string,"created_at"?: string,"hidden_reason"?: string | null,"id"?: string,"stars": number,"status"?: Database["public"]['Enums']["review_status"],"tags"?: (string)[],"text"?: string | null,"updated_at"?: string,"vendor_id": string,"vendor_replied_at"?: string | null,"vendor_reply"?: string | null
                  }
                  Update: {
                    "buyer_id"?: string,"created_at"?: string,"hidden_reason"?: string | null,"id"?: string,"stars"?: number,"status"?: Database["public"]['Enums']["review_status"],"tags"?: (string)[],"text"?: string | null,"updated_at"?: string,"vendor_id"?: string,"vendor_replied_at"?: string | null,"vendor_reply"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"societies": {
                  Row: {
                    "active": boolean,"address": string,"area": Database["public"]['Enums']["pilot_area"],"created_at": string,"flats_count": number,"id": string,"lat": number,"lng": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"address"?: string,"area": Database["public"]['Enums']["pilot_area"],"created_at"?: string,"flats_count"?: number,"id"?: string,"lat": number,"lng": number,"name": string
                  }
                  Update: {
                    "active"?: boolean,"address"?: string,"area"?: Database["public"]['Enums']["pilot_area"],"created_at"?: string,"flats_count"?: number,"id"?: string,"lat"?: number,"lng"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stop_events": {
                  Row: {
                    "client_id": string | null,"created_at": string,"gate_id": string,"id": string,"lat": number | null,"lng": number | null,"type": Database["public"]['Enums']["stop_event_type"],"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"gate_id": string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"type": Database["public"]['Enums']["stop_event_type"],"vendor_id": string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"gate_id"?: string,"id"?: string,"lat"?: number | null,"lng"?: number | null,"type"?: Database["public"]['Enums']["stop_event_type"],"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stop_events_gate_id_fkey"
      columns: ["gate_id"]
isOneToOne: false
      referencedRelation: "gates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stop_events_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stop_events_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"stop_skips": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"stop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"id"?: string,"stop_id": string
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"stop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stop_skips_stop_id_fkey"
      columns: ["stop_id"]
isOneToOne: false
      referencedRelation: "stops"
      referencedColumns: ["id"]
    }
                  ]
                },"stops": {
                  Row: {
                    "active": boolean,"created_at": string,"days_of_week": (number)[],"gate_id": string,"id": string,"vendor_id": string,"window_end": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"days_of_week": (number)[],"gate_id": string,"id"?: string,"vendor_id": string,"window_end": string,"window_start": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"days_of_week"?: (number)[],"gate_id"?: string,"id"?: string,"vendor_id"?: string,"window_end"?: string,"window_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stops_gate_id_fkey"
      columns: ["gate_id"]
isOneToOne: false
      referencedRelation: "gates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"vendor_items": {
                  Row: {
                    "created_at": string,"item_id": string,"sort": number,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"item_id": string,"sort"?: number,"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"item_id"?: string,"sort"?: number,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_items_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_items_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_items_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"vendor_page_views": {
                  Row: {
                    "created_at": string,"id": number,"vendor_id": string,"viewer_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"vendor_id": string,"viewer_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"vendor_id"?: string,"viewer_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_page_views_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_page_views_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "vendor_page_views_viewer_id_fkey"
      columns: ["viewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"vendors": {
                  Row: {
                    "allow_calls": boolean,"code": string,"created_at": string,"delivery_available": boolean,"display_name": string,"photo_path": string | null,"pmc_doc_path": string | null,"pmc_vendor_id": string | null,"status": Database["public"]['Enums']["vendor_status"],"status_reason": string | null,"updated_at": string,"user_id": string,"vehicle": Database["public"]['Enums']["vehicle_type"],"vehicle_no": string | null,"verified_at": string | null,"verified_by": string | null,"verified_seen_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_calls"?: boolean,"code"?: string,"created_at"?: string,"delivery_available"?: boolean,"display_name": string,"photo_path"?: string | null,"pmc_doc_path"?: string | null,"pmc_vendor_id"?: string | null,"status"?: Database["public"]['Enums']["vendor_status"],"status_reason"?: string | null,"updated_at"?: string,"user_id": string,"vehicle": Database["public"]['Enums']["vehicle_type"],"vehicle_no"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null,"verified_seen_at"?: string | null
                  }
                  Update: {
                    "allow_calls"?: boolean,"code"?: string,"created_at"?: string,"delivery_available"?: boolean,"display_name"?: string,"photo_path"?: string | null,"pmc_doc_path"?: string | null,"pmc_vendor_id"?: string | null,"status"?: Database["public"]['Enums']["vendor_status"],"status_reason"?: string | null,"updated_at"?: string,"user_id"?: string,"vehicle"?: Database["public"]['Enums']["vehicle_type"],"vehicle_no"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null,"verified_seen_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "vendors_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"waitlist": {
                  Row: {
                    "created_at": string,"id": string,"society_id": string | null,"society_name": string,"user_id": string,"vendor_hint": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"society_id"?: string | null,"society_name": string,"user_id": string,"vendor_hint"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"society_id"?: string | null,"society_name"?: string,"user_id"?: string,"vendor_hint"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "waitlist_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "societies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_metric_society_adoption"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "waitlist_society_id_fkey"
      columns: ["society_id"]
isOneToOne: false
      referencedRelation: "v_vendor_requests"
      referencedColumns: ["society_id"]
    },{
      foreignKeyName: "waitlist_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                }
          }
          Views: {
            "v_metric_alerts_daily": {
                  Row: {
                    "alerts": number | null,"area": Database["public"]['Enums']["pilot_area"] | null,"date": string | null,"opens": number | null,"opens_15m": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_metric_society_adoption": {
                  Row: {
                    "area": Database["public"]['Enums']["pilot_area"],"flats_count": number,"followers": number | null,"name": string,"society_id": string,"vendors": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "area"?: Database["public"]['Enums']["pilot_area"] | null,"flats_count"?: number | null,"followers"?: never,"name"?: string | null,"society_id"?: string | null,"vendors"?: never
                         }
                        Update: {
                           "area"?: Database["public"]['Enums']["pilot_area"] | null,"flats_count"?: number | null,"followers"?: never,"name"?: string | null,"society_id"?: string | null,"vendors"?: never
                         }
                        Relationships: [
                    
                  ]
                },"v_review_public": {
                  Row: {
                    "created_at": string,"hidden_reason": string | null,"id": string,"is_mine": boolean | null,"reviewer_name": string | null,"society_name": string | null,"stars": number,"status": Database["public"]['Enums']["review_status"],"tags": (string)[],"text": string | null,"updated_at": string,"vendor_id": string,"vendor_replied_at": string | null,"vendor_reply": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"v_vendor_public": {
                  Row: {
                    "allow_calls": boolean,"avg_rating": number | null,"code": string,"delivery_available": boolean,"display_name": string,"id": string,"photo_path": string | null,"rating_count": number | null,"stars_1": number | null,"stars_2": number | null,"stars_3": number | null,"stars_4": number | null,"stars_5": number | null,"tag_counts": Json | null,"vehicle": Database["public"]['Enums']["vehicle_type"],"verified_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "vendors_user_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"v_vendor_rating": {
                  Row: {
                    "avg_rating": number | null,"rating_count": number | null,"stars_1": number | null,"stars_2": number | null,"stars_3": number | null,"stars_4": number | null,"stars_5": number | null,"tag_counts": Json | null,"vendor_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                },"v_vendor_requests": {
                  Row: {
                    "answered_at": string | null,"buyer_first_name": string | null,"created_at": string,"default_unit": Database["public"]['Enums']["price_unit"] | null,"for_date": string,"free_text": string | null,"id": string,"item_id": string | null,"item_name": string | null,"note": string | null,"qty": string | null,"society_id": string,"society_name": string,"status": Database["public"]['Enums']["request_status"],"vendor_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "requests_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requests_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "v_vendor_public"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "requests_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["user_id"]
    }
                  ]
                }
          }
          Functions: {
            "action_record":
{ Args: { "p_action": string,"p_client_id": string,"p_result": Json }; Returns: Json
                           },
"action_seen":
{ Args: { "p_client_id": string }; Returns: Json
                           },
"admin_items":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_me":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_mfa_ok":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"admin_moderation":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_societies":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_team":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_vendor":
{ Args: { "p_vendor_id": string }; Returns: Json
                           },
"admin_vendors":
{ Args: { "p_status"?: Database["public"]['Enums']["vendor_status"] }; Returns: Json
                           },
"answer_request":
{ Args: { "p_for_date"?: string,"p_item_key": string,"p_status": Database["public"]['Enums']["request_status"] }; Returns: number
                           },
"approve_item":
{ Args: { "p_item_id": string,"p_name"?: string }; Returns: undefined
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"buyer_home":
{ Args: { "p_society_id": string }; Returns: Json
                           },
"cancel_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"complete_profile":
{ Args: { "p_name": string }; Returns: undefined
                           },
"create_request":
{ Args: { "p_free_text"?: string,"p_item_id"?: string,"p_note"?: string,"p_qty"?: string,"p_society_id": string,"p_vendor_id": string }; Returns: string
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"email_login_available":
{ Args: { "p_email": string }; Returns: boolean
                           },
"event_open_count":
{ Args: { "p_event_id": string }; Returns: number
                           },
"flag_review":
{ Args: { "p_reason": string,"p_review_id": string }; Returns: undefined
                           },
"follow_vendor":
{ Args: { "p_prefs"?: Json,"p_society_id": string,"p_vendor_id": string }; Returns: undefined
                           },
"follower_count":
{ Args: { "p_society_id"?: string,"p_vendor_id": string }; Returns: number
                           },
"generate_vendor_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_vendor_phone":
{ Args: { "p_vendor_id": string }; Returns: string
                           },
"hide_review":
{ Args: { "p_reason": string,"p_review_id": string }; Returns: undefined
                           },
"hook_send_sms":
{ Args: { "event": Json }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_verified_vendor":
{ Args: { "p_vendor_id": string }; Returns: boolean
                           },
"ist_dow":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"ist_now":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"ist_today":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"keep_review":
{ Args: { "p_review_id": string }; Returns: undefined
                           },
"make_admin":
{ Args: { "p_level": Database["public"]['Enums']["admin_level"],"p_name": string,"p_user_id": string }; Returns: undefined
                           },
"mark_notification_opened":
{ Args: { "p_id": string }; Returns: undefined
                           },
"mark_verified_seen":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"menu_json":
{ Args: { "p_date": string,"p_vendor": string }; Returns: Json
                           },
"metrics_daily":
{ Args: { "p_area"?: Database["public"]['Enums']["pilot_area"],"p_from"?: string,"p_to"?: string }; Returns: Json
                           },
"metrics_societies":
{ Args: { "p_area"?: Database["public"]['Enums']["pilot_area"] }; Returns: Json
                           },
"metrics_summary":
{ Args: { "p_area"?: Database["public"]['Enums']["pilot_area"],"p_from"?: string,"p_to"?: string }; Returns: Json
                           },
"metrics_vendors":
{ Args: { "p_area"?: Database["public"]['Enums']["pilot_area"],"p_from"?: string,"p_to"?: string }; Returns: Json
                           },
"my_account":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_deal_today":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_deals_today":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_follower_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "followers": number,"society_id": string,"society_name": string
            }[]
                           },
"my_following":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_requests":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_stops_today":
{ Args: Record<PropertyKey, never>; Returns: {
              "arrival_event_id": string,"arrived_at": string,"followers": number,"gate_id": string,"gate_lat": number,"gate_lng": number,"gate_name": string,"last_arrival_at": string,"leaving_at": string,"left_at": string,"skipped": boolean,"society_id": string,"society_name": string,"stop_id": string,"window_end": string,"window_start": string
            }[]
                           },
"my_stops_week":
{ Args: Record<PropertyKey, never>; Returns: {
              "days_of_week": (number)[],"gate_name": string,"society_name": string,"stop_id": string,"window_end": string,"window_start": string
            }[]
                           },
"my_vendor_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"normalize_phone":
{ Args: { "p_phone": string }; Returns: string
                           },
"notify_context":
{ Args: { "p_kind": string,"p_ref": string }; Returns: Json
                           },
"otp_blocked_until":
{ Args: { "p_phone": string }; Returns: string
                           },
"otp_record_failure":
{ Args: { "p_phone": string }; Returns: string
                           },
"otp_record_success":
{ Args: { "p_phone": string }; Returns: undefined
                           },
"otp_status":
{ Args: { "p_phone": string }; Returns: Json
                           },
"public_society_card":
{ Args: { "p_society_id": string }; Returns: Json
                           },
"public_vendor_card":
{ Args: { "p_code": string }; Returns: Json
                           },
"publish_menu":
{ Args: { "p_client_id"?: string,"p_date": string,"p_items": Json }; Returns: Json
                           },
"record_app_open":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"record_qr_scan":
{ Args: { "p_code": string,"p_source": string }; Returns: undefined
                           },
"record_vendor_view":
{ Args: { "p_vendor_id": string }; Returns: undefined
                           },
"reply_review":
{ Args: { "p_review_id": string,"p_text": string }; Returns: undefined
                           },
"report_vendor":
{ Args: { "p_photo_path"?: string,"p_reason": Database["public"]['Enums']["report_reason"],"p_text"?: string,"p_vendor_id": string }; Returns: string
                           },
"require_admin":
{ Args: { "p_owner_only"?: boolean }; Returns: string
                           },
"require_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"] }; Returns: string
                           },
"resolve_report":
{ Args: { "p_note"?: string,"p_report_id": string,"p_status": Database["public"]['Enums']["report_status"] }; Returns: undefined
                           },
"review_eligibility":
{ Args: { "p_vendor_id": string }; Returns: Json
                           },
"review_vendor":
{ Args: { "p_review_id": string }; Returns: string
                           },
"save_push_token":
{ Args: { "p_token": string }; Returns: undefined
                           },
"save_society":
{ Args: { "p_society_id": string }; Returns: undefined
                           },
"send_deal":
{ Args: { "p_client_id"?: string,"p_items": Json }; Returns: Json
                           },
"set_admin_active":
{ Args: { "p_active": boolean,"p_user_id": string }; Returns: undefined
                           },
"set_admin_level":
{ Args: { "p_level": Database["public"]['Enums']["admin_level"],"p_user_id": string }; Returns: undefined
                           },
"set_notify_pref":
{ Args: { "p_key": string,"p_value": boolean }; Returns: Json
                           },
"set_primary_society":
{ Args: { "p_society_id": string }; Returns: undefined
                           },
"set_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"] }; Returns: undefined
                           },
"set_setting":
{ Args: { "p_key": string,"p_value": Json }; Returns: undefined
                           },
"set_sold_out":
{ Args: { "p_client_id"?: string,"p_item_id": string,"p_sold_out": boolean }; Returns: Json
                           },
"set_stock_photo":
{ Args: { "p_client_id"?: string,"p_path": string }; Returns: Json
                           },
"set_vendor_status":
{ Args: { "p_reason"?: string,"p_status": Database["public"]['Enums']["vendor_status"],"p_vendor_id": string }; Returns: undefined
                           },
"setting_int":
{ Args: { "p_default": number,"p_key": string }; Returns: number
                           },
"skip_stop":
{ Args: { "p_date"?: string,"p_stop_id": string }; Returns: Json
                           },
"society_served":
{ Args: { "p_society_id": string }; Returns: boolean
                           },
"submit_review":
{ Args: { "p_stars": number,"p_tags"?: (string)[],"p_text"?: string,"p_vendor_id": string }; Returns: string
                           },
"undo_stop_event":
{ Args: { "p_event_id": string }; Returns: undefined
                           },
"unfollow_vendor":
{ Args: { "p_society_id"?: string,"p_vendor_id": string }; Returns: undefined
                           },
"unskip_stop":
{ Args: { "p_date"?: string,"p_stop_id": string }; Returns: undefined
                           },
"upsert_stop":
{ Args: { "p_active"?: boolean,"p_days": (number)[],"p_end": string,"p_gate_id": string,"p_id": string,"p_start": string,"p_vendor_id": string }; Returns: string
                           },
"v_vendor_today":
{ Args: { "p_society_id": string }; Returns: {
              "gate_id": string,"gate_name": string,"is_following": boolean,"status": string,"status_at": string,"stop_id": string,"vendor_id": string,"window_end": string,"window_start": string
            }[]
                           },
"vendor_active_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"vendor_arrive":
{ Args: { "p_client_id"?: string,"p_gate_id": string,"p_lat"?: number,"p_lng"?: number }; Returns: Json
                           },
"vendor_by_code":
{ Args: { "p_code": string }; Returns: string
                           },
"vendor_leaving_soon":
{ Args: { "p_client_id"?: string,"p_gate_id": string }; Returns: Json
                           },
"vendor_left":
{ Args: { "p_client_id"?: string,"p_gate_id": string }; Returns: Json
                           },
"vendor_page":
{ Args: { "p_society_id"?: string,"p_vendor_id": string }; Returns: Json
                           },
"vendor_public_stops":
{ Args: { "p_vendor_id": string }; Returns: {
              "days_of_week": (number)[],"gate_id": string,"gate_name": string,"skipped_today": boolean,"society_id": string,"society_name": string,"stop_id": string,"window_end": string,"window_start": string
            }[]
                           },
"vendor_serves_society":
{ Args: { "p_society": string,"p_vendor": string }; Returns: boolean
                           },
"vendor_stop_event":
{ Args: { "p_client_id": string,"p_gate_id": string,"p_type": Database["public"]['Enums']["stop_event_type"] }; Returns: Json
                           },
"vendor_stop_today":
{ Args: { "p_gate": string,"p_vendor": string }; Returns: string
                           },
"vendors_in_area":
{ Args: { "p_area": Database["public"]['Enums']["pilot_area"] }; Returns: string[]
                           },
"verify_vendor":
{ Args: { "p_vendor_id": string }; Returns: undefined
                           },
"warn_vendor":
{ Args: { "p_note": string,"p_report_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "admin_level": "owner"|"field_staff","notif_type": "arrival"|"leaving_soon"|"deal"|"not_coming"|"request_reply"|"vendor_new_requests"|"vendor_new_rating","pilot_area": "karve_nagar"|"sus_pashan","price_unit": "kg"|"g500"|"g250"|"bunch"|"piece","report_reason": "wrong_weight"|"bad_quality"|"rude"|"fake_listing"|"other","report_status": "open"|"actioned"|"dismissed","request_status": "open"|"will_bring"|"cant_bring"|"cancelled","review_status": "visible"|"hidden","stop_event_type": "arrived"|"leaving_soon"|"left"|"not_going","user_role": "buyer"|"vendor"|"admin","vehicle_type": "tempo"|"thela","vendor_status": "pending"|"needs_info"|"verified"|"rejected"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "admin_level": ["owner", "field_staff"],"notif_type": ["arrival", "leaving_soon", "deal", "not_coming", "request_reply", "vendor_new_requests", "vendor_new_rating"],"pilot_area": ["karve_nagar", "sus_pashan"],"price_unit": ["kg", "g500", "g250", "bunch", "piece"],"report_reason": ["wrong_weight", "bad_quality", "rude", "fake_listing", "other"],"report_status": ["open", "actioned", "dismissed"],"request_status": ["open", "will_bring", "cant_bring", "cancelled"],"review_status": ["visible", "hidden"],"stop_event_type": ["arrived", "leaving_soon", "left", "not_going"],"user_role": ["buyer", "vendor", "admin"],"vehicle_type": ["tempo", "thela"],"vendor_status": ["pending", "needs_info", "verified", "rejected", "suspended"]
          }
        }
} as const
