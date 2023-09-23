import { SPK } from 'src/entities/spk.entity';
import * as moment from 'moment';
import { SPKStatus } from 'src/utils/enums';

export const ExportSPKResource = (spk: SPK): any => {
  return {
    bop_number: spk.spk_number,
    bop_date: moment(spk.created_at).format('YYYY-MM-DD HH:mm:ss'),
    bop_status:
      spk.status != null && spk.status != undefined
        ? spk.status == SPKStatus.CREATED
          ? 'Waiting Approval RPM'
          : spk.status == SPKStatus.CREATED_OVER_BUDGET
          ? 'Waiting Approval RPM'
          : spk.status == SPKStatus.APPROVED
          ? spk.is_over_budget == true
            ? 'Waiting Approval PM'
            : 'Waiting Transfer'
          : spk.status == SPKStatus.APPROVED_OVER_BUDGET
          ? 'Waiting Transfer'
          : spk.status == SPKStatus.PAID
          ? spk.cost_evidences && spk.cost_evidences.length > 0
            ? 'Waiting Approval Verificator'
            : 'Paid, need evidence'
          : spk.status == SPKStatus.CLOSED
          ? 'Closed'
          : '-'
        : '-',
    region: spk.region && spk.region.name ? spk.region.name : '-',
    transportation:
      spk.transportation && spk.transportation.name
        ? spk.transportation.name
        : '-',
    police_number: spk.police_number,
    cash_advance: spk.cash_advance,
    pay_to_user:
      spk.pay_to_user && spk.pay_to_user.name ? spk.pay_to_user.name : '-',
    bank_account:
      spk.pay_to_user &&
      spk.pay_to_user.bank &&
      spk.pay_to_user.bank_account_number
        ? spk.pay_to_user.bank + ' - ' + spk.pay_to_user.bank_account_number
        : '-',
    site_name: spk.site && spk.site.name ? spk.site.name : '-',
    site_code: spk.site && spk.site.code ? spk.site.code : '-',
    area: spk.area && spk.area.name ? spk.area.name : '-',
    distance: spk.distance ? spk.distance : '-',
    work_type: spk.work_type ? spk.work_type : '-',
    item_description:
      spk.po && spk.po.item_description ? spk.po.item_description : '-',
    category: spk.category ? spk.category.name : '-',
    sitePO: spk.site.sitePO
      ? spk.site.sitePO.map((relatedPO) => {
          return {
            id: relatedPO && relatedPO.id ? relatedPO.id : null,
            po_number:
              relatedPO && relatedPO.po_number ? relatedPO.po_number : '-',
            name: relatedPO && relatedPO.project ? relatedPO.project.name : '-',
          };
        })
      : [],
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
      : [],
    remark_ss: spk.remark_inhouse_team ? spk.remark_inhouse_team : null,
    total_range: spk.total_range ? spk.total_range : 0,
    closing_date: spk.closing_date
      ? moment(spk.closing_date).format('YYYY-MM-DD HH:mm:ss')
      : null,
    operation_cost: spk.operation_cost ? spk.operation_cost : null,
    delta_of_settlement: spk.delta_of_settlement
      ? spk.delta_of_settlement
      : null,
    cashback: spk.cashback ? spk.cashback : null,
    cashout: spk.cashout ? spk.cashout : null,
    remark_admin: spk.remark_admin ? spk.remark_admin : null,
    remark_pm: spk.remark_pm ? spk.remark_pm : null,
    remark_rpm: spk.remark_rpm ? spk.remark_rpm : null,
    remark_verificator: spk.remark_verificator ? spk.remark_verificator : null,
    cost_evidences: spk.cost_evidences
      ? spk.cost_evidences.map((costEvidence) => {
          return {
            id: costEvidence && costEvidence.id ? costEvidence.id : null,
            name: costEvidence && costEvidence.name ? costEvidence.name : '-',
            cost: costEvidence && costEvidence.cost ? costEvidence.cost : null,
          };
        })
      : [],
    created_by: spk.created_by_user ? spk.created_by_user.name : '-',
    approved_by: spk.approved_by_user ? spk.approved_by_user.name : '-',
    approved_over_budget_by: spk.approved_over_budget_by_user
      ? spk.approved_over_budget_by_user.name
      : '-',
    paid_by: spk.paid_by_user ? spk.paid_by_user.name : '-',
    closed_by: spk.closed_by_user ? spk.closed_by_user.name : '-',
  };
};
