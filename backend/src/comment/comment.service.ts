import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import {
  CommentResponseDto,
  CommentAuthorDto,
  CommentAttachmentDto,
} from './dtos/comment-response.dto';
import { ROLES } from '../common/constants/roles.constant';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) { }

  /**
   * Kiểm tra xem user có phải là member của channel không
   */
  private async isChannelMember(
    userId: string,
    channelId: string,
  ): Promise<boolean> {
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

    // Check 2: User là WORKSPACE_ADMIN
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
   * Helper: Map user to CommentAuthorDto
   */
  private mapUserToAuthorDto(user: any): CommentAuthorDto {
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
  private mapAttachments(attachments: any[]): CommentAttachmentDto[] {
    return attachments.map((att) => {
      // Extract filename from URL
      let fileName = '';
      let rawLastPart = '';

      try {
        const url = new URL(att.fileUrl);
        const pathParts = url.pathname.split('/');
        rawLastPart = pathParts[pathParts.length - 1];
        // Decode URL encoded filename
        const decoded = decodeURIComponent(rawLastPart);
        // Remove timestamp prefix if exists (e.g., "1735123456789-filename.jpg")
        // Match: starts with 13+ digits followed by a hyphen
        if (/^\d{13,}-/.test(decoded)) {
          fileName = decoded.replace(/^\d{13,}-/, '');
        } else {
          fileName = decoded;
        }
      } catch {
        // Fallback: simple split
        const urlParts = att.fileUrl.split('/');
        rawLastPart = urlParts[urlParts.length - 1];
        try {
          const decoded = decodeURIComponent(rawLastPart);
          if (/^\d{13,}-/.test(decoded)) {
            fileName = decoded.replace(/^\d{13,}-/, '');
          } else {
            fileName = decoded;
          }
        } catch {
          if (/^\d{13,}-/.test(rawLastPart)) {
            fileName = rawLastPart.replace(/^\d{13,}-/, '');
          } else {
            fileName = rawLastPart;
          }
        }
      }

      // Ensure we have a meaningful filename
      // If filename is empty, only numbers, or very short, use a fallback
      if (!fileName || /^\d+$/.test(fileName) || fileName.length < 2) {
        // Try to get extension from raw URL part
        const possibleExt = rawLastPart.split('.').pop()?.toLowerCase();
        if (possibleExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'mp4', 'mp3'].includes(possibleExt)) {
          fileName = `attachment.${possibleExt}`;
        } else {
          fileName = `attachment_${att.id.slice(0, 6)}`;
        }
      }

      // Get extension - try multiple sources
      let ext = fileName.split('.').pop()?.toLowerCase() || '';

      // If no extension in fileName, try to get from rawLastPart
      if (!ext || ext === fileName.toLowerCase()) {
        const rawExt = rawLastPart.split('.').pop()?.toLowerCase();
        if (rawExt && rawExt !== rawLastPart.toLowerCase()) {
          ext = rawExt;
          // Also update fileName if needed
          if (!fileName.includes('.')) {
            fileName = `${fileName}.${ext}`;
          }
        }
      }

      // Guess mime type from extension
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
        fileName: fileName,
        mimeType: mimeTypes[ext] || 'application/octet-stream',
        createdAt: att.createdAt,
      };
    });
  }

  /**
   * Tạo comment cho bài đăng
   * Chỉ Channel Member hoặc Channel Admin
   */
  async create(
    userId: string,
    channelId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra post tồn tại và thuộc channel
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new BadRequestException('Không thể bình luận bài đăng đã bị xóa');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Kiểm tra user có quyền comment không
    const isMember = await this.isChannelMember(userId, channelId);

    if (!isMember) {
      throw new ForbiddenException(
        'Bạn phải là thành viên của channel để bình luận',
      );
    }

    // 4. Tạo comment với reactable trong transaction
    const comment = await this.prisma.$transaction(async (tx) => {
      // Tạo reactable trước
      const reactable = await tx.reactable.create({
        data: {
          type: 'COMMENT',
        },
      });

      // Tạo comment
      const newComment = await tx.comment.create({
        data: {
          postId,
          authorId: userId,
          content: dto.content,
          reactableId: reactable.id,
        },
        include: {
          author: true,
        },
      });

      return newComment;
    });

    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: this.mapUserToAuthorDto(comment.author),
    };
  }

  /**
   * Lấy tất cả comments của bài đăng
   * Chỉ Channel Member, Channel Admin, hoặc Workspace Admin
   */
  async findAllByPost(
    userId: string,
    channelId: string,
    postId: string,
  ): Promise<CommentResponseDto[]> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra post tồn tại và thuộc channel
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.isDeleted) {
      throw new NotFoundException('Bài đăng đã bị xóa');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Kiểm tra quyền xem comments
    const isMember = await this.isChannelMember(userId, channelId);

    if (!isMember) {
      throw new ForbiddenException(
        'Bạn phải là thành viên của channel để xem bình luận',
      );
    }

    // 4. Lấy tất cả comments với attachments và reactions
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false,
      },
      include: {
        author: true,
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
        createdAt: 'asc',
      },
    });

    return comments.map((comment) => {
      // Group reactions by emoji
      const reactionsGrouped = comment.reactable.reactions.reduce(
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
          acc[reaction.emoji].users.push(reaction.user);
          if (reaction.userId === userId) {
            acc[reaction.emoji].hasReacted = true;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      return {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: this.mapUserToAuthorDto(comment.author),
        attachments: this.mapAttachments(comment.reactable.fileAttachments),
        reactions: Object.values(reactionsGrouped),
      };
    });
  }

  /**
   * Xóa comment (soft delete)
   * Chỉ người tạo comment mới có quyền xóa
   */
  async remove(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
  ): Promise<{ message: string }> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra post tồn tại và thuộc channel
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Tìm comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Bình luận đã bị xóa');
    }

    if (comment.postId !== postId) {
      throw new BadRequestException('Bình luận không thuộc bài đăng này');
    }

    // 4. Kiểm tra quyền xóa (chỉ người tạo comment)
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể xóa bình luận của chính mình',
      );
    }

    // 5. Soft delete comment
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Đã xóa bình luận thành công',
    };
  }

  /**
   * Cập nhật comment
   * Chỉ người tạo comment mới có quyền chỉnh sửa
   */
  async update(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    // 1. Kiểm tra channel tồn tại
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel không tồn tại');
    }

    // 2. Kiểm tra post tồn tại và thuộc channel
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Bài đăng không tồn tại');
    }

    if (post.channelId !== channelId) {
      throw new BadRequestException('Bài đăng không thuộc channel này');
    }

    // 3. Tìm comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Bình luận đã bị xóa');
    }

    if (comment.postId !== postId) {
      throw new BadRequestException('Bình luận không thuộc bài đăng này');
    }

    // 4. Kiểm tra quyền chỉnh sửa (chỉ người tạo comment)
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể chỉnh sửa bình luận của chính mình',
      );
    }

    // 5. Cập nhật comment
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content ?? comment.content,
      },
      include: {
        author: true,
      },
    });

    return {
      id: updatedComment.id,
      postId: updatedComment.postId,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      author: this.mapUserToAuthorDto(updatedComment.author),
    };
  }

  /**
   * Toggle reaction vào comment (thêm nếu chưa có, xóa nếu đã có, thay thế nếu react emoji khác)
   * Mỗi user chỉ có thể react 1 emoji - khi react emoji khác sẽ thay thế emoji cũ
   */
  async toggleReaction(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
    emoji: string,
  ): Promise<{ message: string; reactions: any[] }> {
    // 1. Kiểm tra quyền
    const isMember = await this.isChannelMember(userId, channelId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của channel');
    }

    // 2. Tìm comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted || comment.postId !== postId) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // 3. Tìm tất cả reactions của user này cho comment
    const existingReactions = await this.prisma.reaction.findMany({
      where: {
        reactableId: comment.reactableId,
        userId,
      },
    });

    // Kiểm tra xem đã react emoji này chưa
    const sameEmojiReaction = existingReactions.find((r) => r.emoji === emoji);

    let message: string;
    if (sameEmojiReaction) {
      // User đã react emoji này -> xóa nó (un-react)
      await this.prisma.reaction.delete({
        where: { id: sameEmojiReaction.id },
      });
      message = 'Đã xóa reaction';
    } else {
      // User chưa react emoji này
      // Xóa tất cả reactions cũ của user (nếu có)
      if (existingReactions.length > 0) {
        await this.prisma.reaction.deleteMany({
          where: {
            reactableId: comment.reactableId,
            userId,
          },
        });
        message = 'Đã thay thế reaction';
      } else {
        message = 'Đã thêm reaction';
      }

      // Thêm reaction mới
      await this.prisma.reaction.create({
        data: {
          reactableId: comment.reactableId,
          userId,
          emoji,
        },
      });
    }

    // 4. Lấy danh sách reactions mới
    const reactions = await this.getReactions(userId, channelId, postId, commentId);

    return { message, reactions };
  }

  /**
   * Thêm reaction vào comment (legacy - sử dụng toggleReaction thay thế)
   */
  async addReaction(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
    emoji: string,
  ): Promise<{ message: string }> {
    const result = await this.toggleReaction(userId, channelId, postId, commentId, emoji);
    return { message: result.message };
  }

  /**
   * Xóa reaction khỏi comment
   */
  async removeReaction(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
    emoji: string,
  ): Promise<{ message: string }> {
    // 1. Kiểm tra quyền
    const isMember = await this.isChannelMember(userId, channelId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của channel');
    }

    // 2. Tìm comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted || comment.postId !== postId) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // 3. Xóa reaction
    await this.prisma.reaction.deleteMany({
      where: {
        reactableId: comment.reactableId,
        userId,
        emoji,
      },
    });

    return { message: 'Đã xóa reaction' };
  }

  /**
   * Lấy danh sách reactions của comment
   */
  async getReactions(
    userId: string,
    channelId: string,
    postId: string,
    commentId: string,
  ): Promise<any[]> {
    // 1. Kiểm tra quyền
    const isMember = await this.isChannelMember(userId, channelId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của channel');
    }

    // 2. Tìm comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted || comment.postId !== postId) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // 3. Lấy reactions
    const reactions = await this.prisma.reaction.findMany({
      where: {
        reactableId: comment.reactableId,
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

    // 4. Group by emoji
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
        acc[reaction.emoji].users.push(reaction.user);
        if (reaction.userId === userId) {
          acc[reaction.emoji].hasReacted = true;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped);
  }

  /**
   * Thêm attachments vào comment
   */
  async addAttachments(
    commentId: string,
    fileUrls: string[],
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
        reactable: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Bình luận đã bị xóa');
    }

    // Thêm file attachments
    await this.prisma.fileAttachment.createMany({
      data: fileUrls.map((url) => ({
        reactableId: comment.reactableId,
        fileUrl: url,
      })),
    });

    // Lấy lại comment với attachments
    const updatedComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
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
      id: updatedComment!.id,
      postId: updatedComment!.postId,
      content: updatedComment!.content,
      createdAt: updatedComment!.createdAt,
      updatedAt: updatedComment!.updatedAt,
      author: this.mapUserToAuthorDto(updatedComment!.author),
      attachments: this.mapAttachments(updatedComment!.reactable.fileAttachments),
    };
  }
}
