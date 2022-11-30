import { CouponStatus, CouponType } from 'src/utils/enums';

export const ExportCouponSubmissionResource = (data: any): any => {
  return {
    No: data.no,
    Nama_Kupon: data.coupon_name ? data.coupon_name : '-',
    Kode_Unik: data.code ? data.code : '-',
    Penyelenggara: data.provider_name ? data.provider_name : '-',
    Nilai_Kupon: data.amount ? data.amount : '-',
    Tipe: data.type == CouponType.GENERAL ? 'Umum' : 'Khusus',
    Status:
      data.status == CouponStatus.AVAILABLE
        ? 'Belum Terpakai'
        : data.status == CouponStatus.USED
        ? 'Terpakai'
        : data.status == CouponStatus.NOT_AVAILABLE
        ? 'Tidak Tersedia'
        : 'Tidak Tersedia',
    Tanggal_Persetujuan:
      data.status == CouponStatus.USED && data.updated_at
        ? data.updated_at
        : '-',
    NIP: data.nip ? data.nip : '-',
    Nama_Pemohon: data.user_name ? data.user_name : '-',
    Unit: data.employee_unit ? data.employee_unit : '-',
    Nama_Course: data.course_name ? data.course_name : '-',
    Durasi: data.duration ? Math.round(data.duration / 40) : '-',
    Disetujui_Oleh: data.approver_name,
  };
};
