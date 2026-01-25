/**
 * PhonePilot MCP Server.
 * Provides mechanical arm control and camera capture via MCP protocol.
 * Supports both Streamable HTTP and legacy SSE transports.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { Server } from 'http';
import { randomUUID } from 'crypto';

import {
  armConnectSchema,
  executeArmConnect,
  armDisconnectSchema,
  executeArmDisconnect,
  armMoveSchema,
  executeArmMove,
  armClickSchema,
  executeArmClick,
  captureFrameSchema,
  executeCaptureFrame,
} from './tools';
import { ARM_STATUS_URI, getArmStatusResource } from './resources';
import { sendMcpLog } from './state';

/** MCP Server configuration */
const MCP_CONFIG = {
  name: 'phonepilot',
  version: '1.0.0',
  port: 3847,
} as const;

/** HTTP request function type (injected from main process) */
type HttpRequestFn = (url: string) => Promise<string>;

/**
 * PhonePilot MCP Server class.
 * Manages MCP server lifecycle and tool/resource registration.
 */
export class PhonePilotMcpServer {
  private httpServer: Server | null = null;
  private httpRequest: HttpRequestFn;
  
  // Transport storage for session management
  private streamableTransports: Map<string, StreamableHTTPServerTransport> = new Map();
  private sseTransports: Map<string, SSEServerTransport> = new Map();

  constructor(httpRequest: HttpRequestFn) {
    this.httpRequest = httpRequest;
  }

  /**
   * Creates a new MCP server instance with tools and resources registered.
   */
  private createMcpServer(): McpServer {
    const mcpServer = new McpServer({
      name: MCP_CONFIG.name,
      version: MCP_CONFIG.version,
    });

    this.registerTools(mcpServer);
    this.registerResources(mcpServer);

    return mcpServer;
  }

  /**
   * Registers all MCP tools.
   */
  private registerTools(mcpServer: McpServer): void {
    // arm-connect: Connect to mechanical arm
    mcpServer.tool(
      'arm-connect',
      'Connect to the mechanical arm controller via COM port. Returns a handle for subsequent operations.',
      armConnectSchema.shape,
      async (args) => {
        sendMcpLog({ type: 'request', action: 'arm-connect', detail: JSON.stringify(args) });
        const result = await executeArmConnect(args, this.httpRequest);
        sendMcpLog({
          type: result.success ? 'response' : 'error',
          action: 'arm-connect',
          detail: result.message,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // arm-disconnect: Disconnect from mechanical arm
    mcpServer.tool(
      'arm-disconnect',
      'Disconnect from the mechanical arm controller. Resets position to origin before closing.',
      armDisconnectSchema.shape,
      async (args) => {
        sendMcpLog({ type: 'request', action: 'arm-disconnect', detail: 'Disconnecting...' });
        const result = await executeArmDisconnect(args, this.httpRequest);
        sendMcpLog({
          type: result.success ? 'response' : 'error',
          action: 'arm-disconnect',
          detail: result.message,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    // arm-move: Move arm to position
    mcpServer.tool(
      'arm-move',
      'Move the mechanical arm to a specified X,Y position in millimeters. Optionally returns a camera frame after moving.',
      armMoveSchema.shape,
      async (args) => {
        sendMcpLog({ type: 'request', action: 'arm-move', detail: `X${args.x} Y${args.y}` });
        const { output, frame } = await executeArmMove(args, this.httpRequest);
        sendMcpLog({
          type: output.success ? 'response' : 'error',
          action: 'arm-move',
          detail: output.message,
        });
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ];

        if (frame) {
          content.push({
            type: 'image' as const,
            data: frame,
            mimeType: 'image/jpeg',
          });
        }

        return { content };
      }
    );

    // arm-click: Perform click at current position
    mcpServer.tool(
      'arm-click',
      'Perform a click operation at the current position. Lowers stylus, waits briefly, then raises it. Optionally returns a camera frame.',
      armClickSchema.shape,
      async (args) => {
        sendMcpLog({ type: 'request', action: 'arm-click', detail: `depth=${args.depth || 12}` });
        const { output, frame } = await executeArmClick(args, this.httpRequest);
        sendMcpLog({
          type: output.success ? 'response' : 'error',
          action: 'arm-click',
          detail: output.message,
        });
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ];

        if (frame) {
          content.push({
            type: 'image' as const,
            data: frame,
            mimeType: 'image/jpeg',
          });
        }

        return { content };
      }
    );

    // capture-frame: Capture camera frame
    mcpServer.tool(
      'capture-frame',
      'Capture the current camera frame. Returns a JPEG image showing the current view.',
      captureFrameSchema.shape,
      async (args) => {
        sendMcpLog({ type: 'request', action: 'capture-frame', detail: 'Capturing...' });
        const { output, frame } = await executeCaptureFrame(args);
        sendMcpLog({
          type: output.success ? 'response' : 'error',
          action: 'capture-frame',
          detail: output.message,
        });
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ];

        if (frame) {
          content.push({
            type: 'image' as const,
            data: frame,
            mimeType: 'image/jpeg',
          });
        }

        return { content };
      }
    );
  }

  /**
   * Registers all MCP resources.
   */
  private registerResources(mcpServer: McpServer): void {
    mcpServer.resource(
      'arm-status',
      ARM_STATUS_URI,
      {
        description: 'Current mechanical arm connection status and position',
        mimeType: 'application/json',
      },
      async () => {
        const status = getArmStatusResource();
        return {
          contents: [
            {
              uri: ARM_STATUS_URI,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }
    );
  }

  /**
   * Starts the MCP server with HTTP transport.
   * Supports both Streamable HTTP and legacy SSE transports.
   */
  async start(): Promise<number> {
    const app = express();
    app.use(express.json());

    // CORS headers for all requests
    app.use((_req: Request, res: Response, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

      if (_req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    // Streamable HTTP endpoint - handles POST, GET, DELETE
    app.post('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport = sessionId ? this.streamableTransports.get(sessionId) : undefined;

      if (transport) {
        // Reuse existing transport for this session
        await transport.handleRequest(req, res);
        return;
      }

      // Create new transport for new session
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sendMcpLog({ type: 'info', action: 'session', detail: `Streamable HTTP connected: ${newSessionId.slice(0, 8)}...` });
          this.streamableTransports.set(newSessionId, transport!);
        },
      });

      // Clean up on close
      transport.onclose = () => {
        if (sessionId) {
          this.streamableTransports.delete(sessionId);
          sendMcpLog({ type: 'info', action: 'session', detail: `Streamable HTTP disconnected: ${sessionId.slice(0, 8)}...` });
        }
      };

      // Create new MCP server for this session and connect
      const mcpServer = this.createMcpServer();
      await mcpServer.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res);
    });

    app.get('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      
      if (!sessionId || !this.streamableTransports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID' });
        return;
      }

      const transport = this.streamableTransports.get(sessionId)!;
      await transport.handleRequest(req, res);
    });

    app.delete('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      
      if (!sessionId || !this.streamableTransports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID' });
        return;
      }

      const transport = this.streamableTransports.get(sessionId)!;
      await transport.handleRequest(req, res);
      this.streamableTransports.delete(sessionId);
    });

    // Legacy SSE endpoint
    app.get('/sse', async (_req: Request, res: Response) => {
      const transport = new SSEServerTransport('/message', res);

      // Create new MCP server for this session and connect
      // Note: connect() automatically calls start(), so we don't call it manually
      const mcpServer = this.createMcpServer();
      await mcpServer.connect(transport);

      // Store transport using its internal sessionId (available after connect/start)
      const sessionId = transport.sessionId;
      this.sseTransports.set(sessionId, transport);
      sendMcpLog({ type: 'info', action: 'session', detail: `SSE connected: ${sessionId.slice(0, 8)}...` });

      res.on('close', () => {
        this.sseTransports.delete(sessionId);
        sendMcpLog({ type: 'info', action: 'session', detail: `SSE disconnected: ${sessionId.slice(0, 8)}...` });
      });
    });

    // Legacy SSE message endpoint
    app.post('/message', async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;
      
      if (!sessionId) {
        res.status(400).json({ error: 'Missing sessionId parameter' });
        return;
      }

      const transport = this.sseTransports.get(sessionId);

      if (!transport) {
        sendMcpLog({ type: 'error', action: 'session', detail: `SSE session not found: ${sessionId.slice(0, 8)}...` });
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Pass req.body explicitly to avoid "stream is not readable" error
      // (Express body parser already consumed the stream)
      await transport.handlePostMessage(req, res, req.body);
    });

    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        server: MCP_CONFIG.name,
        version: MCP_CONFIG.version,
        activeSessions: {
          streamable: this.streamableTransports.size,
          sse: this.sseTransports.size,
        },
      });
    });

    return new Promise((resolve) => {
      this.httpServer = app.listen(MCP_CONFIG.port, () => {
        console.log(`PhonePilot MCP Server running on http://localhost:${MCP_CONFIG.port}`);
        console.log('  - Streamable HTTP: POST/GET/DELETE /mcp');
        console.log('  - Legacy SSE: GET /sse, POST /message');
        console.log('  - Health check: GET /health');
        resolve(MCP_CONFIG.port);
      });
    });
  }

  /**
   * Stops the MCP server.
   */
  stop(): void {
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
      this.streamableTransports.clear();
      this.sseTransports.clear();
      console.log('PhonePilot MCP Server stopped');
    }
  }

  /**
   * Gets the server port.
   */
  getPort(): number {
    return MCP_CONFIG.port;
  }
}
