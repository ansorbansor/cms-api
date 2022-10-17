import { IsNotEmpty } from 'class-validator';

export class UpdateUserNotificationTokenDto {
  @IsNotEmpty()
  notification_token: string;
}
