export interface TrackingRecipient {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface TrackingProgress {
  step: string;
  timestamp: string;
}

export interface TrackingItem {
  product_id: string;
  name: string;
  quantity: number;
  selling_price: number;
}

export interface TrackOrderResult {
  order_number: string;
  pnref: string;
  status: string;
  status_display: string;
  order_date: string;
  delivery_date: string;
  shipped_date: string | null;
  amount: string;
  payment_method: string;
  comments: string | null;
  recipient: TrackingRecipient;
  greeting_message: string | null;
  special_instructions: string | null;
  progress: TrackingProgress[];
  live_tracking_available: boolean;
  has_delivery_video: boolean;
  has_delivery_photo: boolean;
  items: TrackingItem[];
}