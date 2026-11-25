/* eslint-disable prettier/prettier */

import minioConfig from 'src/config/minio.config';
import { Absence } from 'src/entities/absence.entity';
import moment from 'moment';

const getFileUrl = (file: any): string | null => {
  if (!file || !file.path) return null;
  return String(file.path).startsWith('http')
    ? file.path
    : minioConfig().fullUrl + file.path;
};

export const AbsenceResource = (absence: Absence): any => {
  return {
    id: absence.id,
    user_id: absence.user ? absence.user.id : absence.user_id,
    nik: absence.user ? absence.user.nik : '-',
    name: absence.user ? absence.user.name : '-',
    region: absence.user ? absence.user.region : '-',
    absence_type: absence.absence_type ?? 'CLOCK_IN_OUT',
    status: absence.status ?? 'COMPLETED',
    absence_date: absence.absence_date
      ? moment(absence.absence_date).format('YYYY-MM-DD')
      : (absence.clock_in ? moment(absence.clock_in).format('YYYY-MM-DD') : '-'),
    is_clarification: absence.is_clarification ?? false,
    special_leave_type: absence.special_leave_type ?? null,
    evidence_file_id: absence.evidence_file_id ?? null,
    evidence_file_url: getFileUrl(absence.evidence_file),
    evidence_uploaded_at: absence.evidence_uploaded_at
      ? moment(absence.evidence_uploaded_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    deadline_at: absence.deadline_at
      ? moment(absence.deadline_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    notes: absence.notes ?? null,
    rejection_reason: absence.rejection_reason ?? null,
    rejected_at: absence.rejected_at
      ? moment(absence.rejected_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    reviewed_by: absence.reviewed_by ?? null,
    reviewer_name: absence.reviewer ? absence.reviewer.name : null,
    reviewed_at: absence.reviewed_at
      ? moment(absence.reviewed_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    clock_in: absence.clockInParseDate ? absence.clockInParseDate : '-',
    clock_out: absence.clockOutParseDate ? absence.clockOutParseDate : '-',
    clock_in_latitude: absence.clock_in_latitude ? absence.clock_in_latitude : '-',
    clock_in_longitude: absence.clock_in_longitude ? absence.clock_in_longitude : '-',
    clock_out_latitude: absence.clock_out_latitude ? absence.clock_out_latitude : '-',
    clock_out_longitude: absence.clock_out_longitude ? absence.clock_out_longitude : '-',
    late_reason: absence.late_reason ? absence.late_reason : '-',
    activity_plan: absence.activity_plan ?? '-',
    activity_result: absence.activity_result ?? '-',
    source: absence.source ?? 'app',
    clock_in_source: absence.clock_in_source ?? absence.source ?? 'app',
    clock_out_source: absence.clock_out_source ?? absence.source ?? 'app',
  };
};

export const AbsenceResourceDetail = (absence: Absence): any => {
  return {
    id: absence.id,
    user_id: absence.user ? absence.user.id : absence.user_id,
    nik: absence.user ? absence.user.nik : '-',
    name: absence.user ? absence.user.name : '-',
    region: absence.user ? absence.user.region : '-',
    absence_type: absence.absence_type ?? 'CLOCK_IN_OUT',
    status: absence.status ?? 'COMPLETED',
    absence_date: absence.absence_date
      ? moment(absence.absence_date).format('YYYY-MM-DD')
      : (absence.clock_in ? moment(absence.clock_in).format('YYYY-MM-DD') : '-'),
    is_clarification: absence.is_clarification ?? false,
    special_leave_type: absence.special_leave_type ?? null,
    evidence_file_id: absence.evidence_file_id ?? null,
    evidence_file_url: getFileUrl(absence.evidence_file),
    evidence_uploaded_at: absence.evidence_uploaded_at
      ? moment(absence.evidence_uploaded_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    deadline_at: absence.deadline_at
      ? moment(absence.deadline_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    notes: absence.notes ?? null,
    rejection_reason: absence.rejection_reason ?? null,
    rejected_at: absence.rejected_at
      ? moment(absence.rejected_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    reviewed_by: absence.reviewed_by ?? null,
    reviewer_name: absence.reviewer ? absence.reviewer.name : null,
    reviewed_at: absence.reviewed_at
      ? moment(absence.reviewed_at).format('YYYY-MM-DD HH:mm:ss')
      : null,
    clock_in: absence.clockInParseDate ? absence.clockInParseDate : '-',
    clock_out: absence.clockOutParseDate ? absence.clockOutParseDate : '-',
    clock_in_photo: getFileUrl(absence.clock_in_photo_file),
    clock_out_photo: getFileUrl(absence.clock_out_photo_file),
    clock_in_latitude: absence.clock_in_latitude ? absence.clock_in_latitude : '-',
    clock_in_longitude: absence.clock_in_longitude ? absence.clock_in_longitude : '-',
    clock_out_latitude: absence.clock_out_latitude ? absence.clock_out_latitude : '-',
    clock_out_longitude: absence.clock_out_longitude ? absence.clock_out_longitude : '-',
    late_reason: absence.late_reason ? absence.late_reason : '-',
    activity_plan: absence.activity_plan ?? '-',
    activity_result: absence.activity_result ?? '-',
    source: absence.source ?? 'app',
    clock_in_source: absence.clock_in_source ?? absence.source ?? 'app',
    clock_out_source: absence.clock_out_source ?? absence.source ?? 'app',
  };
};

export const HasAbsenceToday = (
  hasAbsence: boolean,
  absence: Absence,
  mustClockIn: boolean,
  mustClockOut: boolean,
  afterOffice: boolean,
  lateAbsence: boolean,
  clockInId: number,
  leaveQuotaInfo?: any,
  pendingTasksCount?: number,
  unrecordedDaysCount?: number,
): any => {
  return {
    has_absence: hasAbsence,
    absence_type: absence ? (absence.absence_type || 'CLOCK_IN_OUT') : null,
    status: absence ? (absence.status || 'COMPLETED') : null,
    deadline_at: absence && absence.deadline_at ? moment(absence.deadline_at).format('YYYY-MM-DD HH:mm:ss') : null,
    clock_in: absence ? absence.clockInParseDate : null,
    clock_out: absence ? absence.clockOutParseDate : null,
    must_clock_in: mustClockIn,
    must_clock_out: mustClockOut,
    after_office: afterOffice,
    late_absence: lateAbsence,
    clock_in_id: clockInId,
    activity_plan: absence ? absence.activity_plan : null,
    activity_result: absence ? absence.activity_result : null,
    leave_quota: leaveQuotaInfo ?? null,
    pending_tasks_count: pendingTasksCount ?? 0,
    unrecorded_days_count: unrecordedDaysCount ?? 0,
  };
};
