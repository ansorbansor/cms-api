import { User } from 'src/entities/user.entity';
import moment from 'moment';

export const ExportUserResource = (user: User): any => {
  return {
    'Region Office': user.region,
    'GM Region': user.gm_region,
    'Subcont Company': user.company,
    Position: user.category,
    'Resource Name': user.name,
    'ID Number (KTP)': user.nik,
    Email: user.email,
    'Phone Number': user.phone,
    'Hak Access': user.employeePosition ? user.employeePosition.name : null,
    'Employee ID': user.team_number ? user.team_number : 0,
    'Uniportal Account': user.uniportal_account,
    'Join Date': user.project,
    'Remark Employee Status': user.status_description,
    'PASS ID Number': user.pass_id_number,
    'Cyber Security Status': user.cyber_security_status,
    'Status Karyawan': user.level_iresource,
    'WAH Certification Number': user.wah_certification_number,
    'WAH Validation End Date': user.wah_validation_end_date
      ? moment(user.wah_validation_end_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    'Electrical Certification Number': user.electrical_certification_number,
    'Electrical Validation End Date': user.electrical_validation_end_date
      ? moment(user.electrical_validation_end_date).format(
        'YYYY-MM-DD HH:mm:ss',
      )
      : null,
    'First Aid Certification Number': user.firstaid_certification_number,
    'First Aid Validation End Date': user.firstaid_validation_end_date
      ? moment(user.firstaid_validation_end_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    'Nomor Rekening': user.bank_account_number,
    'Nama Bank': user.bank,
  };
};
