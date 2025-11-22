import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinChannelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    example: 'a3f8c912',
    description: 'Join code của channel. Public channel sẽ join thẳng, private channel sẽ tạo join request.'
  })
  joinCode: string;
}

