import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { WsJwtGuard } from "@/common/guards/ws-auth.guard";
import { UseGuards } from "@nestjs/common";

import { ConversationMembersService } from "./conversation-members.service";

@WebSocketGateway({
  namespace: '/conversation',
  cors: {
    origin: '*'
  }
})
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor (
    private readonly messageService: MessagesService,
    private readonly JwtService: JwtService,
    private readonly conversationMembersService: ConversationMembersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!authToken) {
        return client.disconnect()
      }
      const token = authToken.startsWith('Bearer ') ? authToken.split(' ')[1] : authToken;
      const payload = await this.JwtService.verifyAsync(token)
      client.data.user = payload;
    } catch (error) {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    // Clean up if needed when client disconnects
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket()client: Socket, @MessageBody() data: {conversationId: string}) {
    const isMember = await this.conversationMembersService.checkIsMember(data.conversationId, client.data.user.sub);
    if (!isMember) {
      return;
    }
    client.join(data.conversationId)
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    const message = await this.messageService.createMessage(data, client.data.user.sub);
    this.server.to(data.conversation_id).emit('new_message', message);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, isTyping: boolean}) {
    const userId = client.data.user.sub;
    const fullName = client.data.user.fullName;
    const avatar = client.data.user.avatar;

    client.to(data.conversationId).emit('typing', {userId, fullName, avatar});
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stop_typing')
  handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string}) {
    const userId = client.data.user.sub;
    const fullName = client.data.user.fullName;
    const avatar = client.data.user.avatar;

    client.to(data.conversationId).emit('stop_typing', {userId, fullName, avatar});
  }
}