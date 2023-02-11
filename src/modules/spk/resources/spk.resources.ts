import { SPK } from 'src/entities/spk.entity';
import * as moment from 'moment';
import minioConfig from 'src/config/minio.config';
import { SPKStatus } from 'src/utils/enums';

export const SPKResource = (spk: SPK): any => {
  return {
    id: spk.id,
    spk_number: spk.spk_number,
    spk_date: moment(spk.created_at).format('yyyy-MM-D HH:mm:ss'),
    po_number: spk.po && spk.po.po_number ? spk.po.po_number : '-',
    cash_advance: spk.cash_advance,
    spk_status:
      spk.status != null && spk.status != undefined
        ? {
            status: spk.status,
            name:
              spk.status == SPKStatus.CREATED
                ? 'Dibuat'
                : spk.status == SPKStatus.CREATED_OVER_BUDGET
                ? 'Dibuat Over Budget'
                : spk.status == SPKStatus.APPROVED
                ? 'Disetujui'
                : spk.status == SPKStatus.APPROVED_OVER_BUDGET
                ? 'Disetujui Over Budget'
                : spk.status == SPKStatus.PAID
                ? 'Dibayar'
                : spk.status == SPKStatus.CLOSED
                ? 'Diselesaikan'
                : '-',
          }
        : null,
  };
};

export const SPKResourceDetail = (spk: SPK): any => {
  return {
    id: spk.id,
    spk_number: spk.spk_number,
    spk_date: moment(spk.created_at).format('yyyy-MM-D HH:mm:ss'),
    spk_status:
      spk.status != null && spk.status != undefined
        ? {
            status: spk.status,
            name:
              spk.status == SPKStatus.CREATED
                ? 'Dibuat'
                : spk.status == SPKStatus.CREATED_OVER_BUDGET
                ? 'Dibuat Over Budget'
                : spk.status == SPKStatus.APPROVED
                ? 'Disetujui'
                : spk.status == SPKStatus.APPROVED_OVER_BUDGET
                ? 'Disetujui Over Budget'
                : spk.status == SPKStatus.PAID
                ? 'Dibayar'
                : spk.status == SPKStatus.CLOSED
                ? 'Diselesaikan'
                : '-',
          }
        : null,
    region: {
      id: spk.region && spk.region.id ? spk.region.id : null,
      name: spk.region && spk.region.name ? spk.region.name : '-',
    },
    transportation: {
      id:
        spk.transportation && spk.transportation.id
          ? spk.transportation.id
          : null,
      name:
        spk.transportation && spk.transportation.name
          ? spk.transportation.name
          : '-',
    },
    police_number: spk.police_number,
    cash_advance: spk.cash_advance,
    total_cash_advance: spk.total_cash_advance
      ? Number(spk.total_cash_advance)
      : null,
    pay_to_user: {
      id: spk.pay_to_user && spk.pay_to_user.id ? spk.pay_to_user.id : null,
      name:
        spk.pay_to_user && spk.pay_to_user.name ? spk.pay_to_user.name : '-',
    },
    site: {
      id: spk.site && spk.site.id ? spk.site.id : null,
      name: spk.site && spk.site.name ? spk.site.name : '-',
    },
    area: {
      id: spk.area && spk.area.id ? spk.area.id : null,
      name: spk.area && spk.area.name ? spk.area.name : '-',
    },
    distance: spk.distance ? spk.distance : '-',
    work_type: spk.work_type ? spk.work_type : '-',
    po: {
      item_description:
        spk.po && spk.po.item_description ? spk.po.item_description : '-',
      total_unit_price: spk.total_po_unit_price
        ? Number(spk.total_po_unit_price)
        : null,
    },
    distance_to_site_photo: spk.distance_to_site_file
      ? minioConfig().fullUrl + spk.distance_to_site_file.path
      : null,
    inhouse_team: spk.inhouse_team
      ? spk.inhouse_team.map((inhouseTeam) => {
          return {
            id:
              inhouseTeam && inhouseTeam.userInhouse
                ? inhouseTeam.userInhouse.id
                : null,
            name:
              inhouseTeam && inhouseTeam.userInhouse
                ? inhouseTeam.userInhouse.name
                : '-',
            position:
              inhouseTeam &&
              inhouseTeam.userInhouse &&
              inhouseTeam.userInhouse.employeePosition
                ? inhouseTeam.userInhouse.employeePosition.name
                : '-',
          };
        })
      : null,
    remark_inhouse_team: spk.remark_inhouse_team
      ? spk.remark_inhouse_team
      : null,
    total_range: spk.total_range ? spk.total_range : 0,
    km_range_start_photo: spk.km_range_start_file
      ? minioConfig().fullUrl + spk.km_range_start_file.path
      : null,
    km_range_end_photo: spk.km_range_end_file
      ? minioConfig().fullUrl + spk.km_range_end_file.path
      : null,
    check_in_photo: spk.check_in_file
      ? minioConfig().fullUrl + spk.check_in_file.path
      : null,
    check_out_photo: spk.check_out_file
      ? minioConfig().fullUrl + spk.check_out_file.path
      : null,
    closing_date: spk.closing_date
      ? moment(spk.closing_date).format('yyyy-MM-D HH:mm:ss')
      : null,
    operation_cost: spk.operation_cost ? spk.operation_cost : null,
    delta_of_settlement: spk.delta_of_settlement
      ? spk.delta_of_settlement
      : null,
    cashback: spk.cashback ? spk.cashback : null,
    cashout: spk.cashout ? spk.cashout : null,
    remark_admin: spk.remark_admin ? spk.remark_admin : null,
    cost_evidences: spk.cost_evidences
      ? spk.cost_evidences.map((costEvidence) => {
          return {
            id: costEvidence && costEvidence.id ? costEvidence.id : null,
            name: costEvidence && costEvidence.name ? costEvidence.name : '-',
            cost: costEvidence && costEvidence.cost ? costEvidence.cost : null,
            photo:
              costEvidence && costEvidence.cost_evidence_photo_file
                ? minioConfig().fullUrl +
                  costEvidence.cost_evidence_photo_file.path
                : null,
          };
        })
      : null,
    created_by: spk.created_by_user ? spk.created_by_user.name : '-',
    approved_by: spk.approved_by_user ? spk.approved_by_user.name : '-',
    approved_over_budget_by: spk.approved_over_budget_by_user
      ? spk.approved_over_budget_by_user.name
      : '-',
    paid_by: spk.paid_by_user ? spk.paid_by_user.name : '-',
    closed_by: spk.closed_by_user ? spk.closed_by_user.name : '-',
  };
};
