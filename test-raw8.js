const { callKaprukaTool } = require('./lib/kapruka-mcp');
const { parseSearchProducts } = require('./lib/parsers/search-products');

async function run() {
  const result = await callKaprukaTool('kapruka_search_products', { q: 'cake', max_price: 800 });
  console.log("Parsed products count with q 'cake' and max_price 800:", parseSearchProducts(result).products.length);
}
run();
