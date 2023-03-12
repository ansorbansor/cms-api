import { SPK } from 'src/entities/spk.entity';
import * as moment from 'moment';
import minioConfig from 'src/config/minio.config';
import { SPKStatus } from 'src/utils/enums';

export const ExportSPKResource = (spk: SPK): any => {
  return {
    spk_number: spk.spk_number,
    spk_date: moment(spk.created_at).format('YYYY-MM-DD hh:mm:ss'),
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
    region: spk.region && spk.region.name ? spk.region.name : '-',
    transportation:
      spk.transportation && spk.transportation.name
        ? spk.transportation.name
        : '-',
    police_number: spk.police_number,
    cash_advance: spk.cash_advance,
    total_cash_advance: spk.total_cash_advance
      ? Number(spk.total_cash_advance)
      : null,
    pay_to_user:
      spk.pay_to_user && spk.pay_to_user.name ? spk.pay_to_user.name : '-',
    site: spk.site && spk.site.name ? spk.site.name : '-',
    area: spk.area && spk.area.name ? spk.area.name : '-',
    distance: spk.distance ? spk.distance : '-',
    work_type: spk.work_type ? spk.work_type : '-',
    po: spk.po && spk.po.item_description ? spk.po.item_description : '-',
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
            nik:
              inhouseTeam && inhouseTeam.userInhouse
                ? inhouseTeam.userInhouse.nik
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
    closing_date: spk.closing_date
      ? moment(spk.closing_date).format('YYYY-MM-DD hh:mm:ss')
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
