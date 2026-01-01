import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/whoami')
  whoAmI() {
    return { server: process.env.SERVER_NAME }; // SERVER_NAME="A" hoặc "B"
  }
}
