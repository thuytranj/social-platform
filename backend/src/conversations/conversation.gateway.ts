import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { WsJwtGuard } from "@/common/guards/ws-auth.guard";
import { UseGuards, Inject, forwardRef } from "@nestjs/common";
import { WsMemberGuard } from "./guards/ws-member.guard";

import { ReactionsService } from "@/reactions/reactions.service";
import { ReactionTargetType, ReactionType } from "@/reactions/entities/reaction.entity";
import { ConversationsService } from "./conversations.service";

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
    @Inject(forwardRef(() => ReactionsService))
    private readonly reactionsService: ReactionsService,
    private readonly conversationsService: ConversationsService,
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

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket()client: Socket, @MessageBody() data: {conversationId: string}) {
    client.join(data.conversationId)
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    const message = await this.messageService.createMessage(data, client.data.user.sub);
    this.server.to(data.conversation_id).emit('new_message', message);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string}) {
    const userId = client.data.user.sub;
    const fullName = client.data.user.fullName || client.data.user.username || 'User';
    const avatar = client.data.user.avatar;

    client.to(data.conversationId).emit('typing', {userId, fullName, avatar});
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('stop_typing')
  handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string}) {
    const userId = client.data.user.sub;
    const fullName = client.data.user.fullName || client.data.user.username || 'User';
    const avatar = client.data.user.avatar;

    client.to(data.conversationId).emit('stop_typing', {userId, fullName, avatar});
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('update_message')
  async handleUpdateMessage(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, messageId: string, content: string}) {
    const message = await this.messageService.updateMessage(data.messageId, client.data.user.sub, data.content);
    this.server.to(message.conversation_id).emit('message_updated', message);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('add_reaction')
  async handleAddReaction(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, messageId: string, reaction: ReactionType}) {
    const reaction = await this.reactionsService.create(client.data.user.sub, {
      target_type: ReactionTargetType.MESSAGE,
      target_id: data.messageId,
      type: data.reaction,
    });
    this.server.to(data.conversationId).emit('message_reacted', reaction);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('update_reaction')
  async handleUpdateReaction(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, messageId: string, reaction: ReactionType}) {
    const reaction = await this.reactionsService.update(client.data.user.sub, {
      target_type: ReactionTargetType.MESSAGE,
      target_id: data.messageId,
      type: data.reaction,
    });
    this.server.to(data.conversationId).emit('message_reacted', reaction);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, messageId: string, reaction: ReactionType}) {
    const reaction = await this.reactionsService.remove(client.data.user.sub, data.messageId, ReactionTargetType.MESSAGE);
    this.server.to(data.conversationId).emit('message_unreacted', reaction);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string, messageId: string}) {
    await this.messageService.deleteMessage(data.messageId, client.data.user.sub);
    this.server.to(data.conversationId).emit('message_deleted', data.messageId);
  }

  @UseGuards(WsJwtGuard, WsMemberGuard)
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() data: {conversationId: string}) {
    await this.conversationsService.markAsRead(data.conversationId, client.data.user.sub);
    this.server.to(data.conversationId).emit('message_read', {conversationId: data.conversationId, userId: client.data.user.sub, lastReadTime: new Date()});
  }

}