const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({
  url: "https://09d6c88e-2dd6-477d-9011-a77c3a9a43f5.sa-east-1-0.aws.cloud.qdrant.io",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6NDBiNmJkN2YtODk2MC00OGZiLWI5YzgtMDhjMGJhZWY3ZjQ1In0.yjsKTHEcUMUWr8OFJ0uvlRjCu544g5VHqZlIWuPxPdQ"
});

async function run() {
  const collections = await client.getCollections();
  console.log("Collections:", collections);
  
  const points = await client.scroll('kapruka_catalog', { limit: 5 });
  console.log("First 5 points in kapruka_catalog payload:", points.points.map(p => p.payload.name));
}
run().catch(console.error);
