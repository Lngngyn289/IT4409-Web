import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewJoinRequestDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  @ApiProperty({ 
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED'],
    description: 'Trạng thái duyệt: APPROVED hoặc REJECTED'
  })
  status: 'APPROVED' | 'REJECTED';
}

