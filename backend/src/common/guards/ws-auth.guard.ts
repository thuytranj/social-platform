import { CanActivate, Injectable, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const authToken = client.handshake.auth?.token || client.handshake.headers?.authorization;
      
      if (!authToken) {
        throw new WsException("Unauthorized: Missing token")
      }
      
      const token = authToken.startsWith('Bearer ') ? authToken.split(' ')[1] : authToken;
      const payload = await this.jwtService.verifyAsync(token);
      
      client.data.user = payload;
      return true;
    } catch (error) {
      throw new WsException("Unauthorized: Invalid token")
    }
  }
}