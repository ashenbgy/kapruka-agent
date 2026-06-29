import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { RecipientPreferences } from "@/types/chat";
import { KaprukaSearchProduct } from "@/types/kapruka";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "kapruka_catalog";

let qdrantClient: QdrantClient | null = null;
let openaiClient: OpenAI | null = null;

function getQdrant() {
    if (!qdrantClient) {
        qdrantClient = new QdrantClient({ 
            url: QDRANT_URL,
            apiKey: QDRANT_API_KEY
        });
    }
    return qdrantClient;
}

function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

// Function to generate embedding
async function getEmbedding(text: string): Promise<number[]> {
    const openai = getOpenAI();
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return response.data[0].embedding;
}

// Function to setup and index the catalog
export async function initializeLongTermMemory() {
    const qdrant = getQdrant();
    
    // Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
        console.log(`Creating Qdrant collection: ${COLLECTION_NAME}`);
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 1536, // size of text-embedding-3-small
                distance: "Cosine"
            }
        });
    }

    // Read catalog.json
    const catalogPath = path.join(process.cwd(), "data", "catalog.json");
    if (!fs.existsSync(catalogPath)) {
        console.warn("No catalog.json found to index.");
        return;
    }

    const catalogData = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    
    // Simplistic indexing loop
    // In production, you'd batch this and check if already indexed.
    console.log(`Indexing ${catalogData.length} products to Qdrant...`);
    const points = [];
    
    for (const [index, product] of catalogData.entries()) {
        const textToEmbed = `${product.name} - ${product.description || ""}`;
        const vector = await getEmbedding(textToEmbed);
        
        points.push({
            id: index + 1, // Qdrant IDs must be positive integers or UUIDs
            vector,
            payload: {
                id: product.id || String(index),
                name: product.name,
                price: product.price,
                description: product.description,
                url: product.url || product.productUrl,
                availability: product.availability
            }
        });
    }
    
    if (points.length > 0) {
        await qdrant.upsert(COLLECTION_NAME, { wait: true, points });
        console.log("Finished indexing products.");
    }
}

// Semantic search function
export async function searchSemanticCatalog(
    query: string,
    preferences?: RecipientPreferences,
    limit: number = 5
): Promise<KaprukaSearchProduct[]> {
    try {
        const qdrant = getQdrant();
        const vector = await getEmbedding(query);
        
        // Build filter based on allergies and dislikes
        let filter: any = undefined;
        
        // We do not have complex keyword matching inside Qdrant natively without exact match schemas,
        // so we retrieve more results and filter post-retrieval, OR we just trust RAG/LLM reflection 
        // to filter. Since we already have `reflectAndFilterProducts` in the agent, we can just 
        // use vector search here and let the existing reflection loop do the hard safety filtering.
        
        const searchResult = await qdrant.search(COLLECTION_NAME, {
            vector,
            limit: limit * 2, // Fetch extra for safety filtering downstream
        });

        const products: KaprukaSearchProduct[] = searchResult.map((res: any) => ({
            id: res.payload.id,
            name: res.payload.name,
            price: Number(res.payload.price),
            currency: "LKR",
            stockLabel: res.payload.availability || "In Stock",
            productUrl: res.payload.url || "#"
        }));

        return products;
    } catch (e) {
        console.error("Qdrant search failed:", e);
        return [];
    }
}
