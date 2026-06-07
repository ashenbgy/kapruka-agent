# Kapruka Gift Mate 🇱🇰

A full-screen multilingual AI shopping concierge built for the **Kapruka Agent Challenge 2026**.

Kapruka Gift Mate helps customers discover thoughtful gifts, browse Kapruka’s live catalog, build a multi-item gift box, confirm delivery availability, and create a secure guest-checkout payment link.

## Live Demo

[Open Kapruka Gift Mate](https://kapruka-agent-lime.vercel.app)

## What Makes It Different

Kapruka Gift Mate is designed to feel like a warm Sri Lankan gift concierge rather than a basic product-search form.

Customers can chat naturally in:

* English
* Singlish
* Sinhala

The assistant guides customers from:

```text
“I need a gift for Amma”
```

to:

```text
Product discovery
→ Add favourites to the gift box
→ Check delivery
→ Add a personal message
→ Review the order
→ Create a secure checkout link
```

## Features

### 💬 Full-screen conversational shopping

* Immersive chat-first experience
* Fixed chat composer that stays visible while browsing
* Smart auto-scroll that pauses when the customer scrolls upward
* Horizontally scrollable quick prompts
* Visual starter cards
* Curated gift-discovery paths
* Warm, concise assistant personality

### 🎨 Visual product discovery

* Live Kapruka product cards
* Product images
* LKR prices
* Stock labels
* Product categories
* Recommendation badges such as:

  * Budget pick
  * Premium choice
  * Warm gesture
  * Celebration pick
  * Gift Mate pick
* Helpful recommendation descriptions
* Six initial cards with a **Show more options** action
* Product-detail caching and in-progress request deduplication

### 🇱🇰 English, Singlish, and Sinhala support

Example prompts:

```text
Show me flowers for Amma
Amma ta flowers tikak ona
අම්මාට මල් බලන්න
```

The assistant adapts its response style to the customer’s language.

### 🔎 Guided gift discovery

The agent supports:

* Product search
* Category browsing
* Budget-aware recommendations
* Generic gift-help flows
* Multi-turn follow-up questions
* Deterministic handling for common requests
* AI-powered assistance for open-ended recommendations

Examples:

```text
Show me gifts under Rs. 5000
Show cheaper ones
Add the second one
Remove cake
Can you deliver to Kandy?
```

### 🛒 Multi-item gift box

Customers can:

* Add multiple products
* Increase or decrease quantities
* Remove items
* Clear the cart
* Continue browsing without the drawer opening after every add
* Add a cake icing message for cake products

### 🚚 Delivery validation

* Canonical Kapruka delivery-city autocomplete
* Vernacular alias support
* Delivery-date selection
* Per-item delivery checks
* Delivery-fee display
* Perishable-item warnings
* Delivery-state reset when the cart, city, or date changes

### 🎁 Gift-specific checkout

Customers can add:

* Recipient details
* Sender details
* Anonymous sender mode for surprise gifts
* Gift messages
* English, Singlish, and Sinhala gift-message suggestions
* Cake icing text
* Delivery location type:

  * House
  * Apartment
  * Office
  * Other
* Delivery instructions

### 🧾 End-to-end guest checkout

* Multi-step checkout progress indicator
* Cart review
* Delivery confirmation
* Customer-details form
* Final order review
* Explicit confirmation before creating an order
* Secure Kapruka click-to-pay link
* Order tracking

## Example Demo Journey

Try this flow:

```text
Show me flowers for Amma
Show cheaper ones
Add the second one
Can you deliver to Kandy?
```

Then:

```text
Open the gift box
→ Select Kandy
→ Choose a future delivery date
→ Confirm delivery
→ Add recipient details
→ Add a gift message
→ Review the order
→ Create the secure checkout link
```

Sinhala example:

```text
අම්මාට මල් බලන්න
```

Singlish example:

```text
Amma ta flowers tikak ona
Ganan adu ewa pennanna
Add the first one
```

## How It Works

```text
Customer message
→ Deterministic intent handling or AI assistance
→ Safe Kapruka MCP tool call
→ Live products, categories, delivery locations, or tracking results
→ Add products to the gift box
→ Validate delivery for every item
→ Add personal gift details
→ Review and confirm the order
→ Open the Kapruka payment page
```

Checkout creation remains behind an explicit customer-confirmation step.

## Kapruka MCP Tools Used

* `kapruka_search_products`
* `kapruka_get_product`
* `kapruka_list_categories`
* `kapruka_list_delivery_cities`
* `kapruka_check_delivery`
* `kapruka_create_order`
* `kapruka_track_order`

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand
* Zod
* OpenAI tool calling
* Kapruka MCP
* Vercel

## Run Locally

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create a `.env.local` file:

```env
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
OPENAI_API_KEY=replace_with_your_openai_api_key
OPENAI_MODEL=replace_with_your_working_model_name
```

`OPENAI_API_KEY` is optional. Without it, deterministic handling still supports common product searches, category browsing, delivery lookup, cheaper-option requests, and tracking.

## Validation

Run these checks before deploying:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Safety Notes

* Order creation is handled separately through the cart review screen.
* Customers must explicitly confirm before a checkout link is created.
* Delivery must be validated before checkout.
* Do not commit `.env.local` or API keys to GitHub.
* Product reads use caching to reduce unnecessary MCP traffic.

## Challenge Highlights

This project directly addresses key Kapruka Agent Challenge bonus areas:

```text
🛒 Multi-item carts
📅 Delivery-date constraints
🎁 Gift messaging
💬 Singlish conversation
🇱🇰 Sinhala-language support
```

## Future Improvements

* One-click multi-product gift bundles
* Product comparison cards
* Voice input
* Streaming assistant responses
* Saved shopping sessions
* More occasion-specific recommendations

## Author

Built as a solo entry for the **Kapruka Agent Challenge 2026**.

---

Built with ❤️ for Sri Lankan gifting.