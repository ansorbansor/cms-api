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
          ? minioConfig().fullUrl + user.photoFile.path
          : null,
      provider: user.provider,
      status: user.status,
      project: user.project, // <-- ADD THIS LINE
      notification_token: user.notification_token,
      access: mapAccess,
    },
  };
};