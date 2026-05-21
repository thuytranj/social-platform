import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConversationMembersService } from '../conversation-members.service';

@Injectable()
export class WsMemberGuard implements CanActivate {
  constructor(
    private readonly conversationMembersService: ConversationMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();

    const userId = client.data?.user?.sub;
    if (!userId) {
      throw new WsException('Unauthorized: User not authenticated');
    }

    const conversationId = data?.conversationId || data?.conversation_id;
    
    if (!conversationId) {
      return true; 
    }
    const isMember = await this.conversationMembersService.checkIsMember(conversationId, userId);
    
    if (!isMember) {
      throw new WsException('Forbidden: You are not a member of this conversation');
    }

    return true;
  }
}
