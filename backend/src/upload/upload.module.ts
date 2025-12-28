import { Module, forwardRef } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MaterialModule } from '../material/material.module';
import { ChatModule } from '../chat/chat.module';
import { PostModule } from '../post/post.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [
    forwardRef(() => MaterialModule),
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
    ChatModule,
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule { }
