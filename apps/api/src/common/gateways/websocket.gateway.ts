// ============================================
// WEBSOCKET GATEWAY — Real-time Updates
// apps/api/src/common/gateways/websocket.gateway.ts
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/ws',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server
  private readonly logger = new Logger(RealtimeGateway.name)
  private connectedUsers = new Map<string, string>() // userId -> socketId

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1]
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET })

      this.connectedUsers.set(payload.sub, client.id)
      client.join(`org:${payload.orgId}`)
      client.join(`user:${payload.sub}`)

      this.logger.log(`✅ Client connected: ${payload.sub}`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.connectedUsers.entries()]
      .find(([, sid]) => sid === client.id)?.[0]
    if (userId) this.connectedUsers.delete(userId)
    this.logger.log(`❌ Client disconnected: ${client.id}`)
  }

  // ─── JOIN CONVERSATION ROOM ──────────────
  @SubscribeMessage('join:conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conv:${data.conversationId}`)
    return { status: 'joined' }
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conv:${data.conversationId}`)
  }

  // ─── TYPING INDICATOR ───────────────────
  @SubscribeMessage('typing:start')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; userId: string }) {
    client.to(`conv:${data.conversationId}`).emit('typing:update', { userId: data.userId, typing: true })
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; userId: string }) {
    client.to(`conv:${data.conversationId}`).emit('typing:update', { userId: data.userId, typing: false })
  }

  // ─── EMIT HELPERS ────────────────────────

  // Emit new message to conversation room
  emitNewMessage(orgId: string, conversationId: string, message: any) {
    this.server.to(`org:${orgId}`).emit('message:new', { conversationId, message })
    this.server.to(`conv:${conversationId}`).emit('message:received', message)
  }

  // Emit new lead notification
  emitNewLead(orgId: string, contact: any) {
    this.server.to(`org:${orgId}`).emit('lead:new', contact)
  }

  // Emit conversation assigned
  emitAssigned(orgId: string, userId: string, conversation: any) {
    this.server.to(`user:${userId}`).emit('conversation:assigned', conversation)
    this.server.to(`org:${orgId}`).emit('conversation:updated', conversation)
  }

  // Emit notification to specific user
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification)
  }

  // Emit dashboard stats update
  emitStatsUpdate(orgId: string, stats: any) {
    this.server.to(`org:${orgId}`).emit('stats:update', stats)
  }

  // Emit campaign progress
  emitCampaignProgress(orgId: string, campaignId: string, progress: any) {
    this.server.to(`org:${orgId}`).emit('campaign:progress', { campaignId, ...progress })
  }
}
