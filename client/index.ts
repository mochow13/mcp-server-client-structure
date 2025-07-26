import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import readline from "readline/promises";

import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
}

class MCPClient {
    private mcp: Client;
    private transport: StreamableHTTPClientTransport | null = null;
    private genAI: GoogleGenAI;
    private tools: FunctionDeclaration[] = [];

    constructor() {
        this.genAI = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
    }

    async connectToServer(serverUrl: string) {
        /**
         * Connect to an MCP server
         *
         * @param serverUrl - The MCP server URL
         */
        try {
            // Initialize transport and connect to server
            const url = new URL(serverUrl);
            this.transport = new StreamableHTTPClientTransport(url);
            await this.mcp.connect(this.transport);
            this.setUpTransport();

            // List available tools
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        ...tool.inputSchema,
                        type: Type.OBJECT,
                        properties: tool.inputSchema.properties as Record<string, Schema> | undefined
                    }
                };
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
            );
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    private setUpTransport() {
        if (this.transport === null) {
            return;
        }
        this.transport.onclose = async () => {
            console.log("SSE transport closed.");
            await this.cleanup();
        };

        this.transport.onerror = async (error) => {
            console.log("SSE transport error: ", error);
            await this.cleanup();
        };
    }

    async processQuery(query: string) {
        const contents = [
            {
                role: "user",
                parts: [{
                    text: query,
                }],
            },
        ];

        const config = {
            tools: [{
                functionDeclarations: this.tools
            }]
        }

        console.log("Processing query with contents {} and config {}", contents, config);

        const response = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: config
        });

        const finalText: string[] = [];
        const toolResults = [];

        if (!response.functionCalls || response.functionCalls.length === 0) {
            finalText.push(response.text ? response.text : "");
            return finalText;
        }

        await Promise.all(response.functionCalls.map(async (toolCall) => {
            if (!toolCall.name) {
                console.error("Tool call without a name:", toolCall);
                return;
            }

            console.log(`Calling function: ${toolCall.name}`);
            console.log('Parameters:', JSON.stringify(toolCall.args, null, 2));

            const toolResult = await this.mcp.callTool({
                name: toolCall.name,
                arguments: toolCall.args,
            });

            toolResults.push(toolResult);
            finalText.push(`[Calling tool ${toolCall.name} with args ${JSON.stringify(toolCall.args)}]`);

            const functionResponsePart = {
                name: toolCall.name,
                response: (toolResult.content as any[])[0]
            }

            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                console.log('Adding candidate content to contents:', response.candidates[0].content);
                contents.push(response.candidates[0].content as { role: string; parts: { text: string; }[]; });
            }
            contents.push({
                role: "user",
                parts: [{ functionResponse: functionResponsePart } as any],
            });

            const nextResponse = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: config
            });

            finalText.push(
                nextResponse.text ? nextResponse.text : ""
            );
        }));

        console.log('Final text after processing all tool calls:', finalText.join("\n"));

        return finalText.join("\n");
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
        }
    }

    async cleanup() {
        await this.mcp.close();
    }
}

async function main() {
    const port = 3000;
    const mcpClient = new MCPClient();

    try {
        await mcpClient.connectToServer(`http://localhost:${port}/mcp`);
        await mcpClient.chatLoop();
    } finally {
        await mcpClient.cleanup();
        process.exit(0);
    }
}

main();