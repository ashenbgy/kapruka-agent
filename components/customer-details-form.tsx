"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import type {
  DeliveryAddress,
  RecipientDetails,
  SenderDetails,
} from "@/types/checkout";

interface CustomerDetailsFormProps {
  onBack: () => void;
  onContinue: () => void;
}

export function CustomerDetailsForm({
  onBack,
  onContinue,
}: CustomerDetailsFormProps) {
  const checkout =
    useCheckoutStore();

  const [recipient, setRecipient] =
    useState<RecipientDetails>(
      checkout.recipient,
    );

  const [sender, setSender] =
    useState<SenderDetails>(
      checkout.sender,
    );

  const [address, setAddress] =
    useState<DeliveryAddress>(
      checkout.address,
    );

  const [giftMessage, setGiftMessage] =
    useState(checkout.giftMessage);

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    checkout.setCustomerDetails({
      recipient,
      sender,
      address,
      giftMessage,
    });

    onContinue();
  }

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Back to delivery
      </button>

      <h2 className="mt-5 text-xl font-bold text-white">
        Customer details 🎁
      </h2>

      <p className="mt-2 text-sm text-zinc-400">
        Enter the delivery and contact details
        before reviewing your order.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 space-y-7"
      >
        <fieldset className="space-y-3">
          <legend className="font-semibold text-white">
            Recipient
          </legend>

          <TextInput
            label="Recipient name"
            value={recipient.name}
            onChange={(value) =>
              setRecipient({
                ...recipient,
                name: value,
              })
            }
            required
          />

          <TextInput
            label="Recipient phone"
            value={recipient.phone}
            onChange={(value) =>
              setRecipient({
                ...recipient,
                phone: value,
              })
            }
            required
          />

          <TextInput
            label="Recipient email"
            value={recipient.email}
            type="email"
            onChange={(value) =>
              setRecipient({
                ...recipient,
                email: value,
              })
            }
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-white">
            Delivery address
          </legend>

          <p className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-xs text-amber-300">
            Delivering to: {checkout.city}. Make sure the street address matches this city.
          </p>

          <TextInput
            label="Address line 1"
            value={address.addressLine1}
            onChange={(value) =>
              setAddress({
                ...address,
                addressLine1: value,
              })
            }
            required
          />

          <TextInput
            label="Address line 2"
            value={address.addressLine2}
            onChange={(value) =>
              setAddress({
                ...address,
                addressLine2: value,
              })
            }
          />

          <TextInput
            label="Postal code"
            value={address.postalCode}
            onChange={(value) =>
              setAddress({
                ...address,
                postalCode: value,
              })
            }
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-white">
            Sender
          </legend>

          <TextInput
            label="Sender name"
            value={sender.name}
            onChange={(value) =>
              setSender({
                ...sender,
                name: value,
              })
            }
            required
          />

          <TextInput
            label="Sender phone"
            value={sender.phone}
            onChange={(value) =>
              setSender({
                ...sender,
                phone: value,
              })
            }
            required
          />

          <TextInput
            label="Sender email"
            value={sender.email}
            type="email"
            onChange={(value) =>
              setSender({
                ...sender,
                email: value,
              })
            }
          />
        </fieldset>

        <div>
          <label className="text-sm text-zinc-300">
            Gift message
          </label>

          <textarea
            value={giftMessage}
            onChange={(event) =>
              setGiftMessage(
                event.target.value,
              )
            }
            placeholder="Happy birthday! With love..."
            rows={4}
            maxLength={300}
            className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <p className="mt-1 text-right text-xs text-zinc-500">
            {giftMessage.length}/300
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          Review order
        </button>
      </form>
    </section>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function TextInput({
  label,
  value,
  type = "text",
  required = false,
  onChange,
}: TextInputProps) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}