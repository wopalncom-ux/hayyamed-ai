import { Module } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { ChatbotController } from './chatbot.controller'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
