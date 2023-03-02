import appConfig from 'src/config/app.config';
import { User } from 'src/entities/user.entity';
import * as moment from 'moment';

export const UserResource = (user: User): any => {
  const mapRole = [];

  user.userRoles != null
    ? user.userRoles.map((role) => {
        if (role.roleData) {
          mapRole.push({
            id: role.roleData ? role.roleData.id : null,
            name: role.roleData ? role.roleData.name : null,
          });
        }
      })
    : [];

  return {
    id: user.id,
    nik: user.nik,
    name: user.name,
    email: user.email,
    provider: user.provider,
    status: user.status,
    notification_token: user.notification_token,
    photo: user.photoFile
      ? appConfig().fullBackendDomain + user.photoFile.path
      : null,
    roles: mapRole,
    position: {
      id: user.employeePosition ? user.employeePosition.id : null,
      name: user.employeePosition ? user.employeePosition.name : null,
    },
    region: user.region,
    gm_region: user.gm_region,
    company: user.company,
    category: user.category,
    team_number: user.team_number ? user.team_number : 0,
    uniportal_account: user.uniportal_account,
    project: user.project,
    pass_id_number: user.pass_id_number,
    cyber_security_status: user.cyber_security_status,
    level_iresource: user.level_iresource,
    wah_certification_number: user.wah_certification_number,
    wah_validation_end_date: user.wah_validation_end_date
      ? moment(user.wah_validation_end_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    electrical_certification_number: user.electrical_certification_number,
    electrical_validation_end_date: user.electrical_validation_end_date
      ? moment(user.electrical_validation_end_date).format(
          'YYYY-MM-DD hh:mm:ss',
        )
      : null,
    firstaid_certification_number: user.firstaid_certification_number,
    firstaid_validation_end_date: user.firstaid_validation_end_date
      ? moment(user.firstaid_validation_end_date).format('YYYY-MM-DD hh:mm:ss')
      : null,
    status_description: user.status_description,
  };
};
