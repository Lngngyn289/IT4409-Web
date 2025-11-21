import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dtos/create-channel.dto';
import { UpdateChannelDto } from './dtos/update-channel.dto';
import { AddChannelMemberDto } from './dtos/add-member.dto';
import {
  ChannelResponseDto,
  ChannelListItemDto,
} from './dtos/channel-response.dto';
import { ChannelMemberResponseDto } from './dtos/channel-member-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  /**
   * POST /api/channels
   * Tạo channel mới
   * Chỉ Workspace Admin hoặc Privilege Member
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo channel mới trong workspace',
    description:
      'Chỉ Workspace Admin hoặc Workspace Privilege Member mới có quyền tạo channel',
  })
  @ApiResponse({
    status: 201,
    description: 'Channel được tạo thành công',
    type: ChannelResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền tạo channel',
  })
  async create(
    @Req() req: any,
    @Body() createChannelDto: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    const userId = req.user.id;
    return this.channelService.create(userId, createChannelDto);
  }

  /**
   * GET /api/channels
   * Lấy danh sách channel mà user tham gia
   * Query: workspaceId (optional)
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách channel mà user tham gia',
    description:
      'Lấy tất cả channel mà user là member. Có thể filter theo workspaceId',
  })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    description: 'Filter theo workspace ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách channel',
    type: [ChannelListItemDto],
  })
  async findAll(
    @Req() req: any,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<ChannelListItemDto[]> {
    const userId = req.user.id;
    return this.channelService.findAllByUser(userId, workspaceId);
  }

  /**
   * GET /api/channels/:channelId
   * Xem chi tiết channel
   * Chỉ Channel Member hoặc Channel Admin
   */
  @Get(':channelId')
  @ApiOperation({
    summary: 'Xem chi tiết channel',
    description: 'Chỉ Channel Member hoặc Channel Admin mới xem được',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết channel',
    type: ChannelResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem channel',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async findOne(
    @Req() req: any,
    @Param('channelId') channelId: string,
  ): Promise<ChannelResponseDto> {
    const userId = req.user.id;
    return this.channelService.findOne(userId, channelId);
  }

  /**
   * PATCH /api/channels/:channelId
   * Cập nhật channel
   * Chỉ Channel Admin
   */
  @Patch(':channelId')
  @ApiOperation({
    summary: 'Cập nhật tên hoặc mô tả channel',
    description: 'Chỉ Channel Admin mới có quyền cập nhật channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel đã được cập nhật',
    type: ChannelResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật (không phải Channel Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async update(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ): Promise<ChannelResponseDto> {
    const userId = req.user.id;
    return this.channelService.update(userId, channelId, updateChannelDto);
  }

  /**
   * DELETE /api/channels/:channelId
   * Xóa channel
   * Chỉ Channel Admin
   */
  @Delete(':channelId')
  @ApiOperation({
    summary: 'Xóa channel khỏi workspace',
    description: 'Chỉ Channel Admin mới có quyền xóa channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Xóa channel thành công' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa (không phải Channel Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async remove(
    @Req() req: any,
    @Param('channelId') channelId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.channelService.remove(userId, channelId);
  }

  /**
   * POST /api/channels/:channelId/members
   * Thêm thành viên vào channel
   * Chỉ Channel Admin
   */
  @Post(':channelId/members')
  @ApiOperation({
    summary: 'Thêm user vào channel',
    description:
      'Chỉ Channel Admin mới có quyền. Có thể thêm bằng email hoặc userId. User phải là thành viên workspace trước.',
  })
  @ApiResponse({
    status: 201,
    description: 'Thêm thành viên thành công',
    type: ChannelMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User đã là member hoặc không thuộc workspace',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (không phải Channel Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc User không tồn tại',
  })
  async addMember(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Body() addMemberDto: AddChannelMemberDto,
  ): Promise<ChannelMemberResponseDto> {
    const userId = req.user.id;
    return this.channelService.addMember(userId, channelId, addMemberDto);
  }

  /**
   * DELETE /api/channels/:channelId/members/:memberId
   * Xóa thành viên khỏi channel
   * Chỉ Channel Admin
   */
  @Delete(':channelId/members/:memberId')
  @ApiOperation({
    summary: 'Gỡ user ra khỏi channel',
    description:
      'Chỉ Channel Admin mới có quyền. Không thể xóa Admin duy nhất.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành viên thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Đã xóa thành viên khỏi channel',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa Admin duy nhất',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (không phải Channel Admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel hoặc Member không tồn tại',
  })
  async removeMember(
    @Req() req: any,
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.channelService.removeMember(userId, channelId, memberId);
  }

  /**
   * GET /api/channels/:channelId/members
   * Xem danh sách thành viên của channel
   * Channel Member hoặc Channel Admin
   */
  @Get(':channelId/members')
  @ApiOperation({
    summary: 'Lấy danh sách thành viên trong channel',
    description: 'Chỉ Channel Member hoặc Channel Admin mới xem được',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thành viên',
    type: [ChannelMemberResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (không phải member)',
  })
  @ApiResponse({
    status: 404,
    description: 'Channel không tồn tại',
  })
  async getMembers(
    @Req() req: any,
    @Param('channelId') channelId: string,
  ): Promise<ChannelMemberResponseDto[]> {
    const userId = req.user.id;
    return this.channelService.getMembers(userId, channelId);
  }
}

