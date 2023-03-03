/* eslint-disable prettier/prettier */

import { ActivityLog } from "src/entities/activity-log.entity";

export const ActivityLogResource = (activityLog: ActivityLog): any => {

  return {
    id: activityLog.id,
    created_at: activityLog.createdAtParseDate,
    user: activityLog.user ? {
      id: activityLog.user.id,
      name: activityLog.user.name,
      roles: activityLog.user.employeePosition.name,
    } : null,
    description: activityLog.description,
    ip: activityLog.ip,
  };
};
