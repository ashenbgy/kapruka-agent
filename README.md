# Kapruka Gift Mate 🇱🇰

A full-screen AI-powered conversational shopping agent built for the Kapruka Agent Challenge 2026.

## Live Demo

[Open Kapruka Gift Mate](https://kapruka-agent-lime.vercel.app)

## Features

* Live Kapruka MCP product search
* Product cards with live images
* Budget-aware gift discovery
* Curated category browsing
* Singlish and Sinhala prompts
* AI-powered natural-language product discovery
* Delivery-city lookup and delivery-date validation
* Multi-item cart
* Gift messaging
* Explicit checkout confirmation
* Guest-checkout payment links
* Order tracking
* Deterministic fallback when the AI provider is unavailable

## How It Works

```text
User message
→ AI or deterministic intent detection
→ Safe Kapruka MCP tool call
→ Live products, categories, delivery cities, or tracking results
→ Add items to cart
→ Validate delivery
→ Review order
→ Confirm checkout
→ Open Kapruka payment page
```

Checkout creation remains behind an explicit customer confirmation step.

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
* OpenAI tool calling
* Kapruka MCP

## Run Locally

```bash
npm install
cp .env.example .env.local
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

`OPENAI_API_KEY` is optional. If it is not configured, the deterministic fallback still supports common shopping requests.

## Example Prompts

```text
Find a birthday cake under Rs. 8000
I need a thoughtful gift for my mother under Rs. 10000. She likes flowers.
Amma ta flowers tikak ona
අම්මාට මල් බලන්න
Can you deliver to Kandy?
What categories do you have?
Track my order
```

## Safety Notes

* The AI layer can use read-only shopping tools for discovery and guidance.
* Order creation is handled separately through the cart review screen.
* A user must explicitly confirm before a checkout link is created.
* Do not commit `.env.local` or API keys to GitHub.

## Challenge Highlights

* Full-screen conversational shopping experience
* Sinhala and Tanglish support
* Multi-item cart
* Delivery-date constraints
* Gift messaging
* Live guest checkout
* Order tracking
