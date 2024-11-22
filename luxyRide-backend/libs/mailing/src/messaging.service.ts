import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'smtpexpress';

@Injectable()
export class MessagingService {
  private emailClient;

  constructor(private configService: ConfigService) {
    this.emailClient = createClient({
      projectId: this.configService.get('SMTPEXPRESS_PROJECT_ID'),
      projectSecret: this.configService.get('SMTPEXPRESS_PROJECT_SECRET'),
    });
  }
}
