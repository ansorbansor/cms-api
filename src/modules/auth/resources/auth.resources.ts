import minioConfig from 'src/config/minio.config';
import { User } from 'src/entities/user.entity';

export const AuthResource = (token: string, user: User): any => {
  const mapAccess = [];

  if (user.employeePosition?.grant_all_access == true) {
    mapAccess.push({
      id: 999,
      name: 'All Access',
    });
  } else {
    for (const roleAccess of user.employeePosition?.roleAccess) {
      if (roleAccess.menu) {
        mapAccess.push({
          id: roleAccess.menu.id,
          name: roleAccess.menu.name,
        });
      }
    }
  }

  return {
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      photo:
        user.photoFile && user.photoFile.path
          ? (String(user.photoFile.path).startsWith("http") ? user.photoFile.path : minioConfig().fullUrl + user.photoFile.path)
          : null,
      provider: user.provider,
      status: user.status,
      employee_position_id: user.employeePosition?.id,
      employee_position_name: user.employeePosition?.name,
      sub_roles: user.sub_roles || [],
      position: {
        id: user.employeePosition ? user.employeePosition.id : null,
        name: user.employeePosition ? user.employeePosition.name : null,
        code: user.employeePosition ? user.employeePosition.code : null,
        grant_all_access: user.employeePosition ? user.employeePosition.grant_all_access : false,
      },
      effective_sub_roles: Array.isArray(user.sub_roles) ? user.sub_roles : [],
      project: user.project, // <-- ADD THIS LINE
      notification_token: user.notification_token,
      access: mapAccess,
    },
  };
};