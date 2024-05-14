import minioConfig from 'src/config/minio.config';
import { Absence } from 'src/entities/absence.entity';
import moment from 'moment';

export const ExportAbsenceResource = (absence: Absence): any => {
  return {
    Nama: absence.user ? absence.user.name : '-',
    Region: absence.user && absence.user.region ? absence.user.region : '-',
    'Clock In': absence.clockInParseDate ? absence.clockInParseDate : '-',
    'Clock In Location':
      absence.clock_in_latitude && absence.clock_in_longitude
        ? `${absence.clock_in_latitude}, ${absence.clock_in_longitude}`
        : '-',
    'Clock In Photo': absence.clock_in_photo_file
      ? minioConfig().fullUrl + absence.clock_in_photo_file.path
      : null,
    'Clock Out': absence.clockOutParseDate ? absence.clockOutParseDate : '-',
    'Clock Out Location':
      absence.clock_out_latitude && absence.clock_out_longitude
        ? `${absence.clock_out_latitude}, ${absence.clock_out_longitude}`
        : '-',
    'Clock Out Photo': absence.clock_out_photo_file
      ? minioConfig().fullUrl + absence.clock_out_photo_file.path
      : null,
    Status:
      moment(absence.clock_in).toDate().getHours() >= 9
        ? 'Terlambat'
        : 'Tepat Waktu',
    'Alasan Keterlambatan': absence.late_reason ? absence.late_reason : '-',
  };
};
