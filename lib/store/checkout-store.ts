import { create } from "zustand";
import type { CartDeliveryCheck } from "@/types/kapruka";
import type {
  DeliveryAddress,
  RecipientDetails,
  SenderDetails,
} from "@/types/checkout";

interface CheckoutState {
  city: string;
  deliveryDate: string;
  deliveryChecks: CartDeliveryCheck[];
  deliveryValidated: boolean;

  recipient: RecipientDetails;
  sender: SenderDetails;
  address: DeliveryAddress;
  giftMessage: string;

  checkoutConfirmed: boolean;
  payLink: string;
  orderNumber: string;

  setDeliveryDetails: (
    city: string,
    deliveryDate: string,
  ) => void;

  setDeliveryChecks: (
    deliveryChecks: CartDeliveryCheck[],
  ) => void;

  setCustomerDetails: (input: {
    recipient: RecipientDetails;
    sender: SenderDetails;
    address: DeliveryAddress;
    giftMessage: string;
  }) => void;

  setCheckoutConfirmed: (
    confirmed: boolean,
  ) => void;

  setOrderResult: (input: {
    payLink: string;
    orderNumber: string;
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

    checkoutConfirmed: false,
    payLink: "",
    orderNumber: "",

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

    setCustomerDetails: ({
      recipient,
      sender,
      address,
      giftMessage,
    }) =>
      set({
        recipient,
        sender,
        address,
        giftMessage,
        checkoutConfirmed: false,
      }),

    setCheckoutConfirmed: (
      confirmed,
    ) =>
      set({
        checkoutConfirmed: confirmed,
      }),

    setOrderResult: ({
      payLink,
      orderNumber,
    }) =>
      set({
        payLink,
        orderNumber,
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

        checkoutConfirmed: false,
        payLink: "",
        orderNumber: "",
      }),
  }));