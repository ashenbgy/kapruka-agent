import { createOrder } from "./lib/kapruka-tools";

async function run() {
  try {
    const result = await createOrder({
      cart: [{ product_id: "test", quantity: 1 }],
      recipient: { name: "Test", phone: "0771234567" },
      delivery: { address: "Test", city: "Colombo", location_type: "house", date: "2026-06-30" },
      sender: { name: "Test", anonymous: false },
      currency: "LKR",
      response_format: "json"
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
