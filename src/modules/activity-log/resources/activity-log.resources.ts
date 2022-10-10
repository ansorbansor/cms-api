/* eslint-disable prettier/prettier */

import { ActivityLog } from "src/entities/activity-log.entity";

export const ActivityLogResource = (activityLog: ActivityLog): any => {
  const mapRole = activityLog.user && activityLog.user.userRoles != null ? activityLog.user.userRoles.map((role) => {
    return {
      id: role.roleData.id,
      name: role.roleData.name,
    }
  }) : [];

  return {
    id: activityLog.id,
    created_at: activityLog.createdAtParseDate,
    user: activityLog.user ? {
      id: activityLog.user.id,
      name: activityLog.user.name,
      roles: mapRole,
    } : null,
    description: activityLog.description,
    ip: activityLog.ip,
  };
};
