import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { MCPServer } from "./server.js";

const PORT = 3000;

const server = new MCPServer(
    new Server(
        {
            name: "mcp-server",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
                logging: {},
            },
        }
    )
);

const app = express();
app.use(express.json());

const router = express.Router();

// single endpoint for the client to send messages to
const MCP_ENDPOINT = "/mcp";

router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
    await server.handlePostRequest(req, res);
});

router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
    await server.handleGetRequest(req, res);
});

app.use("/", router);

app.listen(PORT, () => {
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
});

process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    await server.cleanup();
    process.exit(0);
});