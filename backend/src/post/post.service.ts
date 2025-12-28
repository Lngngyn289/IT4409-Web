import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import {
  PostResponseDto,
  PostDetailResponseDto,
  PostListItemDto,
  PostAuthorDto,
  CommentPreviewDto,
  PostAttachmentDto,
  PostReactionDto,
} from './dtos/post-response.dto';
import { ROLES } from '../common/constants/roles.constant';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) { }

  /**
   * Kiểm tra xem user có phải là member của channel không
   * User có quyền nếu:
   * 1. Là CHANNEL_MEMBER hoặc CHANNEL_ADMIN của channel đó, HOẶC
   * 2. Là WORKSPACE_ADMIN của workspace chứa channel đó
   */
  private async isChannelMember(
    userId: string,
    channelId: string,
  ): Promise<boolean> {
    // Lấy thông tin channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!channel) return false;

    // Check 1: User là member của channel
    if (channel.members.length > 0) {
      return true;
    }

    // Check 2: User là WORKSPACE_ADMIN của workspace này
    const workspaceMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
      include: { role: true },
    });

    if (workspaceMembership?.role.name === ROLES.WORKSPACE_ADMIN) {
      return true;
    }

    return false;
  }

  /**
   * Helper: Map user to PostAuthorDto
   */
  private mapUserToAuthorDto(user: any): PostAuthorDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? undefined,
    };
  }

  /**
   * Helper: Map attachments
   */
  private mapAttachments(attachments: any[]): PostAttachmentDto[] {
    return attachments.map((att) => {
      // Extract filename from URL
      const urlParts = att.fileUrl.split('/');
      const fileNameWithTimestamp = urlParts[urlParts.length - 1];
      const fileName = fileNameWithTimestamp.replace(/^\d+-/, '');

      // Guess mime type from extension
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        mp4: 'video/mp4',
        mp3: 'audio/mpeg',
      };

      return {
        id: att.id,
        fileUrl: att.fileUrl,
        fileName: decodeURIComponent(fileName),
        mimeType: mimeTypes[ext] || 'application/octet-stream',
        createdAt: att.createdAt,
      };
    });
  }

  /**
   * Helper: Group reactions by emoji
   */
  private groupReactions(reactions: any[], userId: string): PostReactionDto[] {
    const grouped = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            hasReacted: false,
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push({
          id: reaction.user.id,
          username: reaction.user.username,
          fullName: reaction.user.fullName,
          avatarUrl: reaction.user.avatarUrl ?? undefined,
        });
        if (reaction.userId === userId) {
          acc[reaction.emoji].hasReacted = true;
        }
        return acc;
      },
      {} as Record<string, PostReactionDto>,
    );

    return Object.values(grouped);
  }

  /**
   * Tạo bài đăng trong channel
   * Chỉ Channel Member hoặc Channel Admin
   */
  async create(
    userId: string,
    channelId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra user có quyền post trong channel không
    const isMember = await this.isChannelMember(userId, channelId);

    if (!isMember) {
      throw new ForbiddenException(
        'Bạn phải là thành viên của channel để tạo bài đăng',
      );
    }

    // 3. Tạo post với reactable trong transaction
    const post = await this.prisma.$transaction(async (tx) => {
      // Tạo reactable trước
      const reactable = await tx.reactable.create({
        data: {
          type: 'POST',
        },
      });

      // Tạo post
      const newPost = await tx.post.create({
        data: {
          channelId,
          authorId: userId,
          content: dto.content,
          reactableId: reactable.id,
        },
        include: {
          author: true,
          reactable: {
            include: {
              fileAttachments: true,
            },
          },
        },
      });

      return newPost;
    });

    return {
      id: post.id,
      channelId: post.channelId,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: this.mapUserToAuthorDto(post.author),
      attachments: this.mapAttachments(post.reactable.fileAttachments),
    };
  }

  /**
   * Lấy danh sách bài đăng trong channel
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  async findAllByChannel(
    userId: string,
    channelId: string,
  ): Promise<PostListItemDto[]> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra quyền xem posts
    const isMember = await this.isChannelMember(userId, channelId);

    if (!isMember) {
      throw new ForbiddenException(
        'Bạn phải là thành viên của channel để xem bài đăng',
      );
    }

    // 3. Lấy danh sách posts với attachments và reactions
    const posts = await this.prisma.post.findMany({
      where: {
        channelId,
        isDeleted: false,
      },
      include: {
        author: true,
        comments: {
          where: {
            isDeleted: false,
          },
        },
        reactable: {
          include: {
            fileAttachments: true,
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: this.mapUserToAuthorDto(post.author),
      commentCount: post.comments.length,
      attachments: this.mapAttachments(post.reactable.fileAttachments),
      reactions: this.groupReactions(post.reactable.reactions, userId),
    }));
  }

  /**
   * Xem chi tiết bài đăng với 1-3 preview comments
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  async findOne(
    userId: string,
    channelId: string,
    postId: string,
  ): Promise<PostDetailResponseDto> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra quyền xem posts
    const isMember = await this.isChannelMember(userId, channelId);

    if (!isMember) {
      throw new ForbiddenException(
        'Bạn phải là thành viên của channel để xem bài đăng',
      );
    }

    // 3. Tìm post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        comments: {
          where: {
            isDeleted: false,
          },
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 3, // Lấy tối đa 3 comments
        },
        reactable: {
          include: {
            fileAttachments: true,
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new NotFoundException('Bài đăng đã bị xóa');
    }

    // Kiểm tra post có thuộc channel này không
    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 4. Đếm tổng số comments
    const totalComments = await this.prisma.comment.count({
      where: {
        postId: post.id,
        isDeleted: false,
      },
    });

    // 5. Map preview comments
    const previewComments: CommentPreviewDto[] = post.comments.map(
      (comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: this.mapUserToAuthorDto(comment.author),
      }),
    );

    return {
      id: post.id,
      channelId: post.channelId,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: this.mapUserToAuthorDto(post.author),
      previewComments,
      totalComments,
      attachments: this.mapAttachments(post.reactable.fileAttachments),
      reactions: this.groupReactions(post.reactable.reactions, userId),
    };
  }

  /**
   * Cập nhật bài đăng
   * Chỉ người tạo bài đăng mới có quyền chỉnh sửa
   */
  async update(
    userId: string,
    channelId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Tìm post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        reactable: {
          include: {
            fileAttachments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new BadRequestException('Bài đăng đã bị xóa');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Kiểm tra quyền chỉnh sửa (chỉ người tạo post)
    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể chỉnh sửa bài đăng của chính mình',
      );
    }

    // 4. Cập nhật post
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content ?? post.content,
      },
      include: {
        author: true,
        reactable: {
          include: {
            fileAttachments: true,
          },
        },
      },
    });

    return {
      id: updatedPost.id,
      channelId: updatedPost.channelId,
      content: updatedPost.content,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      author: this.mapUserToAuthorDto(updatedPost.author),
      attachments: this.mapAttachments(updatedPost.reactable.fileAttachments),
    };
  }

  /**
   * Xóa bài đăng (soft delete)
   * Chỉ người tạo bài đăng hoặc Channel Admin mới có quyền xóa
   */
  async remove(
    userId: string,
    channelId: string,
    postId: string,
  ): Promise<{ message: string }> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: { userId },
          include: { role: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Tìm post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new BadRequestException('Bài đăng đã bị xóa');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Kiểm tra quyền xóa
    const isAuthor = post.authorId === userId;
    const isChannelAdmin = channel.members.some(
      (m) => m.role.name === ROLES.CHANNEL_ADMIN,
    );

    // Kiểm tra xem user có phải WORKSPACE_ADMIN không
    const workspaceMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
      include: { role: true },
    });

    const isWorkspaceAdmin =
      workspaceMembership?.role.name === ROLES.WORKSPACE_ADMIN;

    if (!isAuthor && !isChannelAdmin && !isWorkspaceAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bài đăng này');
    }

    // 4. Soft delete post
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Đã xóa bài đăng thành công',
    };
  }

  /**
   * Toggle reaction (thêm nếu chưa có, xóa nếu đã có, thay thế nếu react emoji khác)
   * Mỗi user chỉ có thể react 1 emoji - khi react emoji khác sẽ thay thế emoji cũ
   */
  async toggleReaction(
    userId: string,
    channelId: string,
    postId: string,
    emoji: string,
  ): Promise<{ action: 'added' | 'removed' | 'replaced'; reactions: PostReactionDto[] }> {
    // 1. Kiểm tra channel và quyền
    const isMember = await this.isChannelMember(userId, channelId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của channel');
    }

    // 2. Tìm post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted || post.channelId !== channelId) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    // 3. Tìm tất cả reactions của user này cho post
    const existingReactions = await this.prisma.reaction.findMany({
      where: {
        reactableId: post.reactableId,
        userId,
      },
    });

    // Kiểm tra xem đã react emoji này chưa
    const sameEmojiReaction = existingReactions.find((r) => r.emoji === emoji);

    let action: 'added' | 'removed' | 'replaced';

    if (sameEmojiReaction) {
      // User đã react emoji này -> xóa nó (un-react)
      await this.prisma.reaction.delete({
        where: { id: sameEmojiReaction.id },
      });
      action = 'removed';
    } else {
      // User chưa react emoji này
      // Xóa tất cả reactions cũ của user (nếu có)
      if (existingReactions.length > 0) {
        await this.prisma.reaction.deleteMany({
          where: {
            reactableId: post.reactableId,
            userId,
          },
        });
        action = 'replaced';
      } else {
        action = 'added';
      }

      // Thêm reaction mới
      await this.prisma.reaction.create({
        data: {
          reactableId: post.reactableId,
          userId,
          emoji,
        },
      });
    }

    // 4. Lấy lại danh sách reactions
    const reactions = await this.prisma.reaction.findMany({
      where: {
        reactableId: post.reactableId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      action,
      reactions: this.groupReactions(reactions, userId),
    };
  }

  /**
   * Thêm attachments vào post
   */
  async addAttachments(
    postId: string,
    fileUrls: string[],
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        reactable: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new BadRequestException('Bài đăng đã bị xóa');
    }

    // Thêm file attachments
    await this.prisma.fileAttachment.createMany({
      data: fileUrls.map((url) => ({
        reactableId: post.reactableId,
        fileUrl: url,
      })),
    });

    // Lấy lại post với attachments
    const updatedPost = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        reactable: {
          include: {
            fileAttachments: true,
          },
        },
      },
    });

    return {
      id: updatedPost!.id,
      channelId: updatedPost!.channelId,
      content: updatedPost!.content,
      createdAt: updatedPost!.createdAt,
      updatedAt: updatedPost!.updatedAt,
      author: this.mapUserToAuthorDto(updatedPost!.author),
      attachments: this.mapAttachments(updatedPost!.reactable.fileAttachments),
    };
  }

  /**
   * Xóa attachment khỏi post
   */
  async removeAttachment(
    userId: string,
    channelId: string,
    postId: string,
    attachmentId: string,
  ): Promise<{ message: string }> {
    // 1. Tìm post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted || post.channelId !== channelId) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    // 2. Kiểm tra quyền (chỉ người tạo post)
    if (post.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa file này');
    }

    // 3. Xóa attachment
    await this.prisma.fileAttachment.deleteMany({
      where: {
        id: attachmentId,
        reactableId: post.reactableId,
      },
    });

    return { message: 'Đã xóa file' };
  }

  // ============ Legacy methods for backward compatibility ============

  /**
   * @deprecated Use toggleReaction instead
   */
  async addReaction(
    userId: string,
    channelId: string,
    postId: string,
    emoji: string,
  ): Promise<{ message: string }> {
    const result = await this.toggleReaction(userId, channelId, postId, emoji);
    return { message: result.action === 'added' ? 'Đã thêm reaction' : 'Đã xóa reaction' };
  }

  /**
   * @deprecated Use toggleReaction instead
   */
  async removeReaction(
    userId: string,
    channelId: string,
    postId: string,
    emoji: string,
  ): Promise<{ message: string }> {
    const result = await this.toggleReaction(userId, channelId, postId, emoji);
    return { message: result.action === 'removed' ? 'Đã xóa reaction' : 'Đã thêm reaction' };
  }

  /**
   * @deprecated Reactions are now included in post responses
   */
  async getReactions(
    userId: string,
    channelId: string,
    postId: string,
  ): Promise<PostReactionDto[]> {
    const isMember = await this.isChannelMember(userId, channelId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của channel');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted || post.channelId !== channelId) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: {
        reactableId: post.reactableId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.groupReactions(reactions, userId);
  }
}
