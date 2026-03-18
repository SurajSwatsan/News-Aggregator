import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SyncGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SyncGateway');

  afterInit(server: Server) {
    this.logger.log('Sync WebSocket Gateway initialized');
  }

  emitSyncComplete(sourceId: string) {
    this.server.emit('sync-complete', { sourceId });
    this.logger.log(`Emitted sync-complete for source: ${sourceId}`);
  }
}
