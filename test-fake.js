const { callKaprukaTool } = require('./lib/kapruka-mcp');
async function run() {
  const result = await callKaprukaTool('kapruka_search_products', { q: 'Springtime Birthday Ribbon Cake' });
  console.log(result.products?.[0]?.name);
}
run();
