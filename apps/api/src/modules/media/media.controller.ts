import { Controller, Post, Get, Param, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Response } from 'express'
import { MediaService } from './media.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('media')
export class MediaController {
  constructor(private media: MediaService) {}

  // Authenticated upload → returns a public URL for the stored image/video.
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('No file uploaded')
    if (!/^(image|video)\//.test(file.mimetype)) throw new BadRequestException('Only image or video files are allowed')
    const id = await this.media.save(user.orgId, file.originalname, file.mimetype, file.buffer)
    const base = (process.env.API_URL || 'https://api.hayyaai.com').replace(/\/$/, '')
    return { id, url: `${base}/api/v1/media/${id}`, mimeType: file.mimetype, size: file.size }
  }

  // Public serve — WhatsApp/Meta must be able to fetch the media link unauthenticated.
  @Public()
  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const m = await this.media.get(id)
    if (!m) { res.status(404).send('Not found'); return }
    res.set({ 'Content-Type': m.mimeType || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' })
    res.send(m.data)
  }
}
