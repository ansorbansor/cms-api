/* eslint-disable prettier/prettier */

import { ActivityLog } from "src/entities/activity-log.entity";

export const ActivityLogResource = (activityLog: ActivityLog): any => {
  const mapRole = activityLog.user.userRole != null ? activityLog.user.userRole.map((role) => {
    return {
      id: role.role.id,
      name: role.role.name
    }
  }) : [];

  return {
    id: activityLog.id,
    created_at: activityLog.created_at,
    user: activityLog.user ? {
      id: activityLog.user.id,
      name: activityLog.user.name,
      roles: mapRole,
    } : null,
    description: activityLog.description,
  };
};
