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
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import {
  PostResponseDto,
  PostDetailResponseDto,
  PostListItemDto,
} from './dtos/post-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('channels/:channelId/posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * POST /api/channels/:channelId/posts
   * Tạo bài đăng trong channel
   * Chỉ Channel Member hoặc Channel Admin
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo bài đăng trong channel',
    description:
      'Chỉ Channel Member hoặc Channel Admin mới có quyền tạo bài đăng',
  })
  @ApiResponse({
    status: 201,
    description: 'Bài đăng được tạo thành công',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền tạo bài đăng (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async create(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    return this.postService.create(userId, channelId, createPostDto);
  }

  /**
   * GET /api/channels/:channelId/posts
   * Lấy danh sách bài đăng trong channel
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách bài đăng trong channel',
    description:
      'Chỉ Channel Member, Channel Admin, hoặc Workspace Admin mới có quyền xem danh sách bài đăng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bài đăng',
    type: [PostListItemDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async findAll(
    @Req() req: any,
    @Param('channelId') channelId: string,
  ): Promise<PostListItemDto[]> {
    const userId = req.user.id;
    return this.postService.findAllByChannel(userId, channelId);
  }

  /**
   * GET /api/channels/:channelId/posts/:postId
   * Xem chi tiết bài đăng với 1-3 preview comments
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  @Get(':postId')
  @ApiOperation({
    summary: 'Xem chi tiết bài đăng',
    description:
      'Chi tiết bài đăng, kèm 1-3 preview comments. Chỉ Channel Member, Channel Admin, hoặc Workspace Admin mới có quyền xem.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết bài đăng với preview comments',
    type: PostDetailResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc bài đăng không tồn tại',
  })
  async findOne(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
  ): Promise<PostDetailResponseDto> {
    const userId = req.user.id;
    return this.postService.findOne(userId, channelId, postId);
  }

  /**
   * PATCH /api/channels/:channelId/posts/:postId
   * Cập nhật bài đăng
   * Chỉ người tạo bài đăng
   */
  @Patch(':postId')
  @ApiOperation({
    summary: 'Cập nhật bài đăng',
    description: 'Chỉ người tạo bài đăng mới có quyền chỉnh sửa',
  })
  @ApiResponse({
    status: 200,
    description: 'Bài đăng được cập nhật thành công',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền chỉnh sửa (không phải người tạo)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc bài đăng không tồn tại',
  })
  async update(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    return this.postService.update(userId, channelId, postId, updatePostDto);
  }

  /**
   * DELETE /api/channels/:channelId/posts/:postId
   * Xóa bài đăng (soft delete)
   * Người tạo hoặc Channel Admin
   */
  @Delete(':postId')
  @ApiOperation({
    summary: 'Xóa bài đăng',
    description: 'Người tạo bài đăng hoặc Channel Admin mới có quyền xóa',
  })
  @ApiResponse({
    status: 200,
    description: 'Bài đăng đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đã xóa bài đăng thành công' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc bài đăng không tồn tại',
  })
  async remove(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.postService.remove(userId, channelId, postId);
  }

  /**
   * POST /api/channels/:channelId/posts/:postId/reactions
   * Toggle reaction (thêm nếu chưa có, xóa nếu đã có)
   */
  @Post(':postId/reactions')
  @ApiOperation({
    summary: 'Toggle reaction bài đăng',
    description:
      'Toggle reaction: thêm nếu chưa có, xóa nếu đã có. Trả về action và danh sách reactions mới.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction đã được toggle',
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['added', 'removed'] },
        reactions: { type: 'array' },
      },
    },
  })
  async toggleReaction(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Body('emoji') emoji: string,
  ) {
    const userId = req.user.id;
    return this.postService.toggleReaction(userId, channelId, postId, emoji);
  }

  /**
   * DELETE /api/channels/:channelId/posts/:postId/reactions/:emoji
   * Xóa reaction khỏi bài đăng (legacy - sử dụng toggleReaction thay thế)
   */
  @Delete(':postId/reactions/:emoji')
  @ApiOperation({
    summary: 'Xóa reaction khỏi bài đăng',
    description: 'Xóa reaction của mình khỏi bài đăng',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction đã được xóa',
  })
  async removeReaction(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('emoji') emoji: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.postService.removeReaction(userId, channelId, postId, emoji);
  }

  /**
   * GET /api/channels/:channelId/posts/:postId/reactions
   * Lấy danh sách reactions của bài đăng
   */
  @Get(':postId/reactions')
  @ApiOperation({
    summary: 'Lấy danh sách reactions của bài đăng',
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
  ): Promise<any[]> {
    const userId = req.user.id;
    return this.postService.getReactions(userId, channelId, postId);
  }

  /**
   * DELETE /api/channels/:channelId/posts/:postId/attachments/:attachmentId
   * Xóa file đính kèm khỏi bài đăng
   */
  @Delete(':postId/attachments/:attachmentId')
  @ApiOperation({
    summary: 'Xóa file đính kèm',
    description: 'Chỉ người tạo bài đăng mới có quyền xóa file',
  })
  @ApiResponse({
    status: 200,
    description: 'File đã được xóa',
  })
  async removeAttachment(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('postId') postId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.postService.removeAttachment(
      userId,
      channelId,
      postId,
      attachmentId,
    );
  }
}
