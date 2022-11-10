import { IsNotEmpty } from 'class-validator';

export class UpdateUserNotificationTokenDto {
  @IsNotEmpty({ message: 'Notification token tidak boleh kosong' })
  notification_token: string;
}
