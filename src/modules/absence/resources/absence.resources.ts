/* eslint-disable prettier/prettier */

import minioConfig from 'src/config/minio.config';
import { Absence } from 'src/entities/absence.entity';

export const AbsenceResource = (absence: Absence): any => {
  return {
    id: absence.id,
    nik: absence.user ? absence.user.nik : '-',
    name: absence.user ? absence.user.name : '-',
    region: absence.user ? absence.user.region : '-',
    clock_in: absence.clockInParseDate ? absence.clockInParseDate : '-',
    clock_out: absence.clockOutParseDate ? absence.clockOutParseDate : '-',
    clock_in_latitude: absence.clock_in_latitude ? absence.clock_in_latitude : '-',
    clock_in_longitude: absence.clock_in_longitude ? absence.clock_in_longitude : '-',
    clock_out_latitude: absence.clock_out_latitude ? absence.clock_out_latitude : '-',
    clock_out_longitude: absence.clock_out_longitude ? absence.clock_out_longitude : '-',
    late_reason: absence.late_reason ? absence.late_reason : '-',
    activity_plan: absence.activity_plan ?? '-',
    activity_result: absence.activity_result ?? '-',
  };
};

export const AbsenceResourceDetail = (absence: Absence): any => {
  return {
    id: absence.id,
    user_id: absence.user ? absence.user.id : null,
    nik: absence.user ? absence.user.nik : '-',
    name: absence.user ? absence.user.name : '-',
    region: absence.user ? absence.user.region : '-',
    clock_in: absence.clockInParseDate ? absence.clockInParseDate : '-',
    clock_out: absence.clockOutParseDate ? absence.clockOutParseDate : '-',
    clock_in_photo: absence.clock_in_photo_file
      ? minioConfig().fullUrl + absence.clock_in_photo_file.path
      : null,
    clock_out_photo: absence.clock_out_photo_file
      ? minioConfig().fullUrl + absence.clock_out_photo_file.path
      : null,
    clock_in_latitude: absence.clock_in_latitude ? absence.clock_in_latitude : '-',
    clock_in_longitude: absence.clock_in_longitude ? absence.clock_in_longitude : '-',
    clock_out_latitude: absence.clock_out_latitude ? absence.clock_out_latitude : '-',
    clock_out_longitude: absence.clock_out_longitude ? absence.clock_out_longitude : '-',
    late_reason: absence.late_reason ? absence.late_reason : '-',
    activity_plan: absence.activity_plan ?? '-',
    activity_result: absence.activity_result ?? '-',
  };
};

export const HasAbsenceToday = (hasAbsence: boolean, absence: Absence, mustClockIn: boolean, mustClockOut: boolean, afterOffice: boolean, lateAbsence: boolean, clockInId: number): any => {
  return {
    has_absence: hasAbsence,
    clock_in: absence ? absence.clockInParseDate : null,
    clock_out: absence ? absence.clockOutParseDate : null,
    must_clock_in: mustClockIn,
    must_clock_out: mustClockOut,
    after_office: afterOffice,
    late_absence: lateAbsence,
    clock_in_id: clockInId,
    // === MODIFIED HERE: Added activity fields ===
    activity_plan: absence ? absence.activity_plan : null,
    activity_result: absence ? absence.activity_result : null,
  };
};