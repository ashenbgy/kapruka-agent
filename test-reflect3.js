const { reflectAndFilterProducts } = require('./lib/ai/openai-shopping-agent');
const products = [
  { id: 'CAKE00KA002034', name: 'Blueberry Bliss Bento Cheesecake', price: 4200, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002035', name: 'Blackcherry Velvet Bento Cheesecake', price: 3980, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002075', name: 'Midnight Love Bento Chocolate Cake With Chocolate Heart', price: 4450, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002078', name: 'Pastel Love Chocolate Cake', price: 6200, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002079', name: 'Crimson Love Gold Chocolate Sponge Bento Cake With Chocolate Hea', price: 3800, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002092', name: 'Teddy Love Heart Chocolate Bento Cake', price: 3900, currency: 'LKR', productUrl: '', stockLabel: '' },
  { id: 'CAKE00KA002093', name: 'Purple Love Chocolate Sponge Bento Cake', price: 4800, currency: 'LKR', productUrl: '', stockLabel: '' },
];
const { OpenAI } = require('openai');
const openai = new OpenAI();
async function run() {
  const result = await reflectAndFilterProducts('cake', products, undefined, openai);
  console.log("Filtered length:", result.length);
  console.log(result.map(p => p.name));
}
run();
