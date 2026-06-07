export interface RecipientDetails {
  name: string;
  phone: string;
  email: string;
}

export interface SenderDetails {
  name: string;
  phone: string;
  email: string;
}

export type DeliveryLocationType =
  | "house"
  | "apartment"
  | "office"
  | "other";

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  locationType: DeliveryLocationType;
  instructions: string;
}