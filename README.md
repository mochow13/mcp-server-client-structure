# MCP Server-Client Structure

A foundational implementation of a Model Context Protocol (MCP) server with Streamable HTTP transport and a Gemini AI-powered client.

## Overview

This project demonstrates a complete MCP (Model Context Protocol) implementation featuring:

- **MCP Server**: A Node.js/Express server that provides tools and capabilities via HTTP streaming transport
- **MCP Client**: A Gemini AI-powered client that can connect to MCP servers and execute tool calls
- **Streamable HTTP Transport**: Real-time communication between client and server using Server-Sent Events (SSE)

## Architecture

### MCP Server (`server/`)

The server is built with:
- **Express.js** for HTTP handling
- **@modelcontextprotocol/sdk** for MCP protocol implementation
- **StreamableHTTPServerTransport** for real-time communication

**Key Components:**
- `server/src/index.ts`: Express app setup and routing
- `server/src/server.ts`: Core MCP server implementation with session management

**Features:**
- Multi-session support with unique session IDs
- Tool registration and execution framework
- Server-Sent Events (SSE) for real-time streaming
- Proper error handling and cleanup

### MCP Client (`client/`)

The client integrates:
- **Google Gemini AI** for natural language processing
- **@modelcontextprotocol/sdk** for MCP protocol communication
- **StreamableHTTPClientTransport** for server connection

**Key Components:**
- `client/index.ts`: Complete client implementation with chat interface

**Features:**
- Automatic tool discovery from connected MCP servers
- Gemini AI integration for intelligent tool usage
- Interactive chat loop for user queries
- Function calling with automatic tool execution

## How It Works

### Connection Flow

1. **Server Startup**: Express server starts on port 3000 with `/mcp` endpoint
2. **Client Connection**: Client connects to `http://localhost:3000/mcp`
3. **Tool Discovery**: Client automatically discovers available tools from server
4. **Session Management**: Server creates unique sessions for each client connection

### Request Processing

1. **User Query**: User enters a natural language query
2. **AI Processing**: Gemini AI analyzes the query and determines if tools are needed
3. **Tool Execution**: If tools are required, client calls server tools via MCP protocol
4. **Response Generation**: AI processes tool results and generates final response
5. **Streaming**: Real-time communication via SSE for immediate feedback

### Transport Layer

- **POST `/mcp`**: Handle MCP protocol messages and tool calls
- **GET `/mcp`**: Establish SSE stream for real-time communication
- **Session Management**: Each client gets a unique session ID for connection tracking

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

## Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

For the server:
```bash
cd server
npm install
```

For the client:
```bash
cd client
npm install
```

## Running the Application

### 1. Start the MCP Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3000` and display:
```
MCP Streamable HTTP Server listening on port 3000
```

### 2. Start the MCP Client

In a new terminal:

```bash
cd client
npm run dev
```

The client will:
- Connect to the MCP server
- Discover available tools
- Start an interactive chat session

### 3. Interact with the System

Once both are running, you'll see a prompt:
```
Type your queries or 'quit' to exit.

Query: 
```

Enter natural language queries, and the system will:
- Process your request with Gemini AI
- Automatically call relevant tools if needed
- Provide intelligent responses

## Extending the System

### Adding New Tools

To add tools to the MCP server, modify `server/src/server.ts`:

1. **Register the tool** in the `ListToolsRequestSchema` handler:
```typescript
return {
    tools: [
        {
            name: "your_tool_name",
            description: "Description of what your tool does",
            inputSchema: {
                type: "object",
                properties: {
                    // Define your tool's parameters
                }
            }
        }
    ],
};
```

2. **Implement the tool logic** in the `CallToolRequestSchema` handler:
```typescript
if (toolName === "your_tool_name") {
    // Implement your tool logic here
    return {
        content: [
            {
                type: "text",
                text: "Tool execution result"
            }
        ]
    };
}
```

### Customizing the Client

The client can be extended to:
- Connect to multiple MCP servers
- Use different AI models
- Implement custom tool calling strategies
- Add conversation history management

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── index.ts      # Express app and routing
│   │   └── server.ts     # MCP server implementation
│   └── package.json
├── client/
│   ├── index.ts          # MCP client with Gemini AI
│   └── package.json
├── .env                  # Environment variables
└── README.md
```

## Key Technologies

- **Model Context Protocol (MCP)**: Standardized protocol for AI-tool integration
- **Google Gemini AI**: Advanced language model for natural language processing
- **Server-Sent Events (SSE)**: Real-time streaming communication
- **Express.js**: Web framework for the MCP server
- **TypeScript**: Type-safe development environment

## Development Notes

- The server supports multiple simultaneous client connections
- Each connection maintains its own session state
- Tool calls are processed asynchronously for better performance
- The system includes proper error handling and cleanup procedures
- SSE transport enables real-time streaming of responses

## Troubleshooting

1. **Connection Issues**: Ensure the server is running before starting the client
2. **API Key Errors**: Verify your Gemini API key is correctly set in `.env`
3. **Port Conflicts**: The server uses port 3000 by default - ensure it's available
4. **Tool Errors**: Check server logs for tool execution issues

This foundational structure provides a robust starting point for building sophisticated MCP-based applications with AI integration.
