import minioConfig from 'src/config/minio.config';
import { User } from 'src/entities/user.entity';

export const AuthResource = (token: string, user: User): any => {
  const mapAccess = [];
  const mapRole = user.userRoles.map((role) => {
    if (role.roleData?.grant_all_access == true) {
      mapAccess.push({
        id: 999,
        name: 'All Access',
      });
    } else {
      for (const roleAccess of role.roleData.roleAccess) {
        if (roleAccess.menu) {
          mapAccess.push({
            id: roleAccess.menu.id,
            name: roleAccess.menu.name,
          });
        }
      }
    }
    return {
      id: role.roleData.id,
      name: role.roleData.name,
    };
  });

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
      notification_token: user.notification_token,
      roles: mapRole,
      access: mapAccess,
    },
  };
};
