import { create } from "zustand";
import type { CartDeliveryCheck } from "@/types/kapruka";

interface CheckoutState {
  city: string;
  deliveryDate: string;
  deliveryChecks: CartDeliveryCheck[];
  deliveryValidated: boolean;

  setDeliveryDetails: (
    city: string,
    deliveryDate: string,
  ) => void;

  setDeliveryChecks: (
    deliveryChecks: CartDeliveryCheck[],
  ) => void;

  resetDelivery: () => void;
}

export const useCheckoutStore =
  create<CheckoutState>((set) => ({
    city: "",
    deliveryDate: "",
    deliveryChecks: [],
    deliveryValidated: false,

    setDeliveryDetails: (
      city,
      deliveryDate,
    ) =>
      set({
        city,
        deliveryDate,
        deliveryChecks: [],
        deliveryValidated: false,
      }),

    setDeliveryChecks: (deliveryChecks) =>
      set({
        deliveryChecks,
        deliveryValidated:
          deliveryChecks.length > 0 &&
          deliveryChecks.every(
            (check) => check.result.available,
          ),
      }),

    resetDelivery: () =>
      set({
        city: "",
        deliveryDate: "",
        deliveryChecks: [],
        deliveryValidated: false,
      }),
  }));