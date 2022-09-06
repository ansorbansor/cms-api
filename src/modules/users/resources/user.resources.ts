/* eslint-disable prettier/prettier */

import minioConfig from "src/config/minio.config";
import { User } from "src/entities/user.entity";

export const UserResource = (user: User): any => {
  const mapRole = [];
  user.userRole != null ? user.userRole.map((role) => {
    if (role.role) {
      mapRole.push({
        id: role.role ? role.role.id : null,
        name: role.role ? role.role.name: null
      });
    }
  }) : [];

  return {
    id: user.id,
    nip: user.nip,
    name: user.name,
    email: user.email,
    provider: user.provider,
    status: user.status,
    notification_token: user.notification_token,
    photo: user.photoFile ? minioConfig().fullUrl + user.photoFile.path : null,
    roles: mapRole,
    course_level: user.course_level,
    blacklist: user.blacklist,
    unit: {
      id: user.employeeUnit ? user.employeeUnit.id : null,
      name: user.employeeUnit ? user.employeeUnit.name : null
    },
    level: {
      id: user.employeeLevel ? user.employeeLevel.id : null,
      name: user.employeeLevel ? user.employeeLevel.name : null
    },
    position: {
      id: user.employeePosition ? user.employeePosition.id : null,
      name: user.employeePosition ? user.employeePosition.name : null
    },
    lesson_hour: user.total_lesson_hours,
  };
};
