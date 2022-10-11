/* eslint-disable prettier/prettier */

import { UserNotification } from "src/entities/user-notification.entity";

export const UserNotificationResource = (notification: UserNotification): any => {
  return {
    id: notification.id,
    title: notification.title,
    description: notification.description,
    created_at: notification.createdAtParseDate,
    type: notification.type,
    is_read: notification.status == 1,
  };
};
