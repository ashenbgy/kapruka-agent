import { searchProducts } from "./lib/kapruka-tools";
import { createOrder } from "./lib/kapruka-tools";

async function run() {
  try {
    const searchResult = await searchProducts("cake", 1);
    console.log("SEARCH_RESULT:", JSON.stringify(searchResult, null, 2));
    
    // We don't have the parsed ID, but let's assume we can regex it from the text
    const text = (searchResult as any).content?.[0]?.text || "";
    const match = text.match(/ID:\s+`([^`]+)`/);
    if (!match) {
        console.error("NO PRODUCT ID FOUND");
        return;
    }
    const productId = match[1];
    console.log("Found product ID:", productId);

    const result = await createOrder({
      cart: [{ product_id: productId, quantity: 1 }],
      recipient: { name: "Test", phone: "0771234567" },
      delivery: { address: "Test", city: "Colombo 01", location_type: "house", date: "2026-06-30" },
      sender: { name: "Test", anonymous: false },
      currency: "LKR",
      response_format: "json"
    });
    console.log("CREATE_ORDER_RESULT_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("CREATE_ORDER_RESULT_END");
  } catch (e) {
    console.error(e);
  }
}
run();
