import { create } from "zustand";
import type { CartDeliveryCheck } from "@/types/kapruka";
import type {
  DeliveryAddress,
  RecipientDetails,
  SenderDetails,
} from "@/types/checkout";
import type { CreateOrderSummary } from "@/lib/parsers/create-order";

interface CheckoutState {
  city: string;
  deliveryDate: string;
  deliveryChecks: CartDeliveryCheck[];
  deliveryValidated: boolean;

  recipient: RecipientDetails;
  sender: SenderDetails;
  address: DeliveryAddress;
  giftMessage: string;
  anonymousSender: boolean;

  /**
   * Selected packaging option for the order. Examples: "standard", "gift_wrap", "gift_box", "custom".
   */
  packagingOption: string;

  /**
   * Preferred delivery time slot. Empty string means no preference.
   */
  timeSlot: string;

  checkoutConfirmed: boolean;

  payLink: string;
  orderRef: string;
  expiresAt: string;
  orderSummary?: CreateOrderSummary;

  setDeliveryDetails: (
    city: string,
    deliveryDate: string,
  ) => void;

  setDeliveryChecks: (
    deliveryChecks: CartDeliveryCheck[],
  ) => void;

  invalidateDelivery: () => void;

  setCustomerDetails: (input: {
    recipient: RecipientDetails;
    sender: SenderDetails;
    address: DeliveryAddress;
    giftMessage: string;
    anonymousSender: boolean;
  }) => void;

  /**
   * Update the selected packaging option.
   */
  setPackagingOption: (option: string) => void;

  /**
   * Update the preferred delivery time slot.
   */
  setTimeSlot: (slot: string) => void;

  setCheckoutConfirmed: (
    confirmed: boolean,
  ) => void;

  setOrderResult: (input: {
    payLink: string;
    orderRef: string;
    expiresAt: string;
    orderSummary: CreateOrderSummary;
  }) => void;

  resetCheckout: () => void;
}

const emptyRecipient: RecipientDetails = {
  name: "",
  phone: "",
  email: "",
};

const emptySender: SenderDetails = {
  name: "",
  phone: "",
  email: "",
};

const emptyAddress: DeliveryAddress = {
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  locationType: "house",
  instructions: "",
};

export const useCheckoutStore =
  create<CheckoutState>((set) => ({
    city: "",
    deliveryDate: "",
    deliveryChecks: [],
    deliveryValidated: false,

    recipient: emptyRecipient,
    sender: emptySender,
    address: emptyAddress,
    giftMessage: "",
    anonymousSender: false,

    // default packaging and time slot selections
    packagingOption: "standard",
    timeSlot: "",

    checkoutConfirmed: false,

    payLink: "",
    orderRef: "",
    expiresAt: "",
    orderSummary: undefined,

    setDeliveryDetails: (
      city,
      deliveryDate,
    ) =>
      set({
        city,
        deliveryDate,
        deliveryChecks: [],
        deliveryValidated: false,
        checkoutConfirmed: false,

        payLink: "",
        orderRef: "",
        expiresAt: "",
        orderSummary: undefined,

        // reset packaging and time slot when starting a new delivery
        packagingOption: "standard",
        timeSlot: "",
      }),

    setDeliveryChecks: (
      deliveryChecks,
    ) =>
      set({
        deliveryChecks,
        deliveryValidated:
          deliveryChecks.length > 0 &&
          deliveryChecks.every(
            (check) =>
              check.result.available,
          ),
        checkoutConfirmed: false,
      }),

    invalidateDelivery: () =>
      set({
        deliveryChecks: [],
        deliveryValidated: false,
        checkoutConfirmed: false,

        payLink: "",
        orderRef: "",
        expiresAt: "",
        orderSummary: undefined,
      }),

    setCustomerDetails: ({
      recipient,
      sender,
      address,
      giftMessage,
      anonymousSender,
    }) =>
      set({
        recipient,
        sender,
        address,
        giftMessage,
        anonymousSender,
        checkoutConfirmed: false,
      }),

    setPackagingOption: (option) =>
      set({
        packagingOption: option,
      }),

    setTimeSlot: (slot) =>
      set({
        timeSlot: slot,
      }),

    setCheckoutConfirmed: (
      confirmed,
    ) =>
      set({
        checkoutConfirmed: confirmed,
      }),

    setOrderResult: ({
      payLink,
      orderRef,
      expiresAt,
      orderSummary,
    }) =>
      set({
        payLink,
        orderRef,
        expiresAt,
        orderSummary,
      }),

    resetCheckout: () =>
      set({
        city: "",
        deliveryDate: "",
        deliveryChecks: [],
        deliveryValidated: false,

        recipient: emptyRecipient,
        sender: emptySender,
        address: emptyAddress,
        giftMessage: "",
        anonymousSender: false,

        packagingOption: "standard",
        timeSlot: "",

        checkoutConfirmed: false,

        payLink: "",
        orderRef: "",
        expiresAt: "",
        orderSummary: undefined,
      }),
  }));