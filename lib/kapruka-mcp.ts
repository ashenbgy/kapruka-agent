import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL =
  process.env.KAPRUKA_MCP_URL ?? "https://mcp.kapruka.com/mcp";

let clientPromise: Promise<Client> | null = null;

async function connectClient(): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

  const client = new Client({
    name: "kapruka-shopping-agent",
    version: "1.0.0",
  });

  await client.connect(transport);
  return client;
}

export async function getKaprukaClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = connectClient().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
}

export async function listKaprukaTools() {
  const client = await getKaprukaClient();
  return client.listTools();
}

function extractMcpErrorText(content: unknown): string {
  if (!Array.isArray(content)) {
    return typeof content === "string"
      ? content
      : JSON.stringify(content);
  }

  return content
    .map((item: unknown) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text;
      }

      return JSON.stringify(item);
    })
    .join("\n");
}

export async function callKaprukaTool<TArgs extends object>(
  name: string,
  args: TArgs,
) {
  const client = await getKaprukaClient();

  const wrappedArgs = {
    params: args,
  };

  console.log(
    `Calling Kapruka MCP tool: ${name}`,
    JSON.stringify(wrappedArgs, null, 2),
  );

  const result = await client.callTool({
    name,
    arguments: wrappedArgs,
  });

  if (result.isError) {
    console.error(
      `Kapruka MCP tool returned an error: ${name}`,
      JSON.stringify(result, null, 2),
    );

    const errorText = extractMcpErrorText(result.content);

    throw new Error(
      `Kapruka MCP call failed: ${name}${
        errorText ? ` — ${errorText}` : ""
      }`,
    );
  }

  return result;
}