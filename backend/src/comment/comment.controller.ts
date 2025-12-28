import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { CommentResponseDto } from './dtos/comment-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('comments')
@Controller('channels/:channelId/posts/:postId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  /**
   * POST /api/channels/:channelId/posts/:postId/comments
   * Tạo comment cho bài đăng
   * Chỉ Channel Member hoặc Channel Admin
   */
  @Post()
  @ApiOperation({
    summary: 'Bình luận bài đăng',
    description: 'Chỉ Channel Member hoặc Channel Admin mới có quyền bình luận',
  })
  @ApiResponse({
    status: 201,
    description: 'Bình luận được tạo thành công',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền bình luận (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc bài đăng không tồn tại',
  })
  async create(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const userId = req.user.id;
    return this.commentService.create(
      userId,
      channelId,
      postId,
      createCommentDto,
    );
  }

  /**
   * GET /api/channels/:channelId/posts/:postId/comments
   * Lấy tất cả comments của bài đăng
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy toàn bộ bình luận của bài đăng',
    description:
      'Chỉ Channel Member, Channel Admin, hoặc Workspace Admin mới có quyền xem danh sách bình luận',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bình luận',
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc bài đăng không tồn tại',
  })
  async findAll(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
  ): Promise<CommentResponseDto[]> {
    const userId = req.user.id;
    return this.commentService.findAllByPost(userId, channelId, postId);
  }

  /**
   * DELETE /api/channels/:channelId/posts/:postId/comments/:commentId
   * Xóa comment (soft delete)
   * Chỉ người tạo comment mới có quyền xóa
   */
  @Delete(':commentId')
  @ApiOperation({
    summary: 'Xóa bình luận',
    description: 'Chỉ người bình luận được xóa comment bản thân',
  })
  @ApiResponse({
    status: 200,
    description: 'Bình luận đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đã xóa bình luận thành công' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa (không phải người tạo comment)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel, bài đăng hoặc bình luận không tồn tại',
  })
  async remove(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.commentService.remove(userId, channelId, postId, commentId);
  }

  /**
   * PATCH /api/channels/:channelId/posts/:postId/comments/:commentId
   * Cập nhật bình luận
   */
  @Patch(':commentId')
  @ApiOperation({
    summary: 'Cập nhật bình luận',
    description: 'Chỉ người tạo bình luận mới có quyền chỉnh sửa',
  })
  @ApiResponse({
    status: 200,
    description: 'Bình luận được cập nhật thành công',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền chỉnh sửa (không phải người tạo)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel, bài đăng hoặc bình luận không tồn tại',
  })
  async update(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const userId = req.user.id;
    return this.commentService.update(
      userId,
      channelId,
      postId,
      commentId,
      updateCommentDto,
    );
  }

  /**
   * POST /api/channels/:channelId/posts/:postId/comments/:commentId/reactions
   * Toggle reaction vào bình luận (thêm nếu chưa có, xóa nếu đã có)
   */
  @Post(':commentId/reactions')
  @ApiOperation({
    summary: 'Toggle reaction vào bình luận',
    description: 'Thêm reaction nếu chưa có, xóa nếu đã có. Trả về danh sách reactions mới.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reaction được toggle thành công',
  })
  async toggleReaction(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('emoji') emoji: string,
  ): Promise<{ message: string; reactions: any[] }> {
    const userId = req.user.id;
    return this.commentService.toggleReaction(
      userId,
      channelId,
      postId,
      commentId,
      emoji,
    );
  }

  /**
   * DELETE /api/channels/:channelId/posts/:postId/comments/:commentId/reactions/:emoji
   * Xóa reaction khỏi bình luận
   */
  @Delete(':commentId/reactions/:emoji')
  @ApiOperation({
    summary: 'Xóa reaction khỏi bình luận',
    description: 'Xóa reaction của mình khỏi bình luận',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction đã được xóa',
  })
  async removeReaction(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Param('emoji') emoji: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.commentService.removeReaction(
      userId,
      channelId,
      postId,
      commentId,
      emoji,
    );
  }

  /**
   * GET /api/channels/:channelId/posts/:postId/comments/:commentId/reactions
   * Lấy danh sách reactions của bình luận
   */
  @Get(':commentId/reactions')
  @ApiOperation({
    summary: 'Lấy danh sách reactions của bình luận',
    description: 'Chỉ Channel Member mới có quyền xem',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách reactions',
  })
  async getReactions(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<any[]> {
    const userId = req.user.id;
    return this.commentService.getReactions(
      userId,
      channelId,
      postId,
      commentId,
    );
  }
}
