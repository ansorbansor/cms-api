import minioConfig from 'src/config/minio.config';
import { Absence } from 'src/entities/absence.entity';

export const ExportAbsenceResource = (absence: Absence): any => {
  return {
    Nama: absence.user ? absence.user.name : '-',
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
  };
};
