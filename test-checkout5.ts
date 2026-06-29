import { searchProducts } from "./lib/kapruka-tools";
import { createOrder } from "./lib/kapruka-tools";

async function run() {
  try {
    const searchResult = await searchProducts({ q: "cake" });
    const text = (searchResult as any).content?.[0]?.text || "";
    const match = text.match(/ID:\s+`([^`]+)`/);
    if (!match) {
        console.error("NO PRODUCT ID FOUND");
        return;
    }
    const productId = match[1];
    
    const result = await createOrder({
      cart: [{ product_id: productId, quantity: 1 }],
      recipient: { name: "Test", phone: "0771234567" },
      delivery: { address: "Test", city: "Colombo 01", location_type: "house", date: "2026-06-30" },
      sender: { name: "Test", anonymous: false },
      currency: "LKR",
      response_format: "json"
    });
    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");
  } catch (e) {
    console.error(e);
  }
}
run();
