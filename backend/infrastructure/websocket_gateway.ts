import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const WebSocketGatewaySchema = z.object({
    gatewayName: z.string().default('Events').describe('Name of the gateway (PascalCase)'),
    namespace: z.string().optional().describe('Socket.IO namespace (e.g., /chat)'),
    events: z.array(z.object({
        name: z.string().describe('Event name (e.g., message, join)'),
        hasPayload: z.boolean().default(true).describe('Whether event has a payload'),
        broadcast: z.boolean().default(false).describe('Broadcast to all clients'),
    })).default([
        { name: 'message', hasPayload: true, broadcast: true },
        { name: 'join', hasPayload: true, broadcast: false },
    ]).describe('List of WebSocket events to handle'),
    withAuth: z.boolean().default(true).describe('Include JWT authentication guard'),
    withRooms: z.boolean().default(true).describe('Include room management methods'),
});

const handler = async (args: z.infer<typeof WebSocketGatewaySchema>): Promise<SkillResult> => {
    const { gatewayName, namespace, events, withAuth, withRooms } = args;

    const files: Record<string, string> = {};
    const lowerName = gatewayName.toLowerCase();

    // Gateway
    const eventHandlers = events.map(event => `
  @SubscribeMessage('${event.name}')
  handle${event.name.charAt(0).toUpperCase() + event.name.slice(1)}(
    @ConnectedSocket() client: Socket,
    ${event.hasPayload ? `@MessageBody() payload: any,` : ''}
  ) {
    console.log(\`[${gatewayName}] ${event.name} from \${client.id}\`${event.hasPayload ? ', payload' : ''});
    
    ${event.broadcast
            ? `// Broadcast to all clients${withRooms ? ' in the room' : ''}
    ${withRooms ? `const room = payload.room || 'general';
    this.server.to(room).emit('${event.name}', {
      from: client.id,
      ...payload,
      timestamp: new Date().toISOString(),
    });` : `this.server.emit('${event.name}', {
      from: client.id,
      ${event.hasPayload ? '...payload,' : ''}
      timestamp: new Date().toISOString(),
    });`}`
            : `// Acknowledge to sender
    return { event: '${event.name}', status: 'received' };`}
  }`).join('\n');

    files[`${lowerName}.gateway.ts`] = `import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger${withAuth ? ', UseGuards' : ''} } from '@nestjs/common';
${withAuth ? `import { WsJwtGuard } from './ws-jwt.guard';` : ''}

@WebSocketGateway({
  ${namespace ? `namespace: '${namespace}',` : ''}
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
${withAuth ? '@UseGuards(WsJwtGuard)' : ''}
export class ${gatewayName}Gateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(${gatewayName}Gateway.name);
  private connectedClients: Map<string, { id: string; userId?: string }> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(\`Client connected: \${client.id}\`);
    this.connectedClients.set(client.id, { id: client.id });
    
    // Notify others
    client.broadcast.emit('user:connected', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(\`Client disconnected: \${client.id}\`);
    this.connectedClients.delete(client.id);
    
    // Notify others
    this.server.emit('user:disconnected', { clientId: client.id });
  }

  ${eventHandlers}

  ${withRooms ? `
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    client.join(payload.room);
    this.logger.log(\`Client \${client.id} joined room: \${payload.room}\`);
    
    // Notify room members
    this.server.to(payload.room).emit('room:joined', {
      clientId: client.id,
      room: payload.room,
    });
    
    return { event: 'room:join', room: payload.room, status: 'joined' };
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    client.leave(payload.room);
    this.logger.log(\`Client \${client.id} left room: \${payload.room}\`);
    
    // Notify room members
    this.server.to(payload.room).emit('room:left', {
      clientId: client.id,
      room: payload.room,
    });
    
    return { event: 'room:leave', room: payload.room, status: 'left' };
  }
  ` : ''}

  /**
   * Utility: Send to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }

  /**
   * Utility: Broadcast to all
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Utility: Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
`;

    // WS JWT Guard
    if (withAuth) {
        files['ws-jwt.guard.ts'] = `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user to socket data
      client.data.user = payload;
      return true;
    } catch (error) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    // Try auth header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try query param
    return client.handshake.query.token as string;
  }
}
`;
    }

    // Module
    files[`${lowerName}.module.ts`] = `import { Module } from '@nestjs/common';
import { ${gatewayName}Gateway } from './${lowerName}.gateway';
${withAuth ? `import { JwtModule } from '@nestjs/jwt';` : ''}

@Module({
  ${withAuth ? `imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],` : ''}
  providers: [${gatewayName}Gateway],
  exports: [${gatewayName}Gateway],
})
export class ${gatewayName}Module {}
`;

    // Client Hook (React)
    files['use-socket.hook.ts'] = `import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UseSocketOptions {
  namespace?: string;
  token?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { namespace = '${namespace || '/'}', token, autoConnect = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!autoConnect) return;

    const socketInstance = io(\`\${SOCKET_URL}\${namespace}\`, {
      auth: token ? { token } : undefined,
      query: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [namespace, token, autoConnect]);

  const emit = useCallback(
    (event: string, data?: any) => {
      socket?.emit(event, data);
    },
    [socket]
  );

  const on = useCallback(
    (event: string, callback: (data: any) => void) => {
      socket?.on(event, callback);
      return () => {
        socket?.off(event, callback);
      };
    },
    [socket]
  );

  const joinRoom = useCallback(
    (room: string) => {
      socket?.emit('room:join', { room });
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (room: string) => {
      socket?.emit('room:leave', { room });
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    emit,
    on,
    joinRoom,
    leaveRoom,
  };
}
`;

    return {
        success: true,
        data: files,
        metadata: {
            gateway: gatewayName,
            namespace,
            events: events.map(e => e.name),
            generatedFiles: Object.keys(files),
        },
    };
};

export const websocketGatewaySkillDefinition: SkillDefinition<typeof WebSocketGatewaySchema> = {
    name: 'websocket_gateway_generator',
    description: 'Generates NestJS WebSocket gateway with Socket.IO, JWT auth, rooms, and React hook.',
    parameters: WebSocketGatewaySchema,
    handler,
};
