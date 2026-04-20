import moment from 'moment';
import minioConfig from 'src/config/minio.config';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { SPKStatus } from 'src/utils/enums';

export const SPKOperationalResource = (spk: SPKOperational): any => {
  return {
    id: spk.id,
    spk_number: spk.spk_number,
    spk_date: moment(spk.created_at).format('YYYY-MM-DD HH:mm:ss'),
    cash_advance: spk.cash_advance,
    spk_status:
      spk.status != null && spk.status != undefined
        ? {
          status: spk.status,
          name:
            spk.status == SPKStatus.CREATED
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
                        : spk.status == SPKStatus.REJECTED
                          ? 'Rejected'
                          : '-',
        }
        : null,
    pay_to_user: {
      id: spk.pay_to_user && spk.pay_to_user.id ? spk.pay_to_user.id : null,
      name:
        spk.pay_to_user && spk.pay_to_user.name ? spk.pay_to_user.name : '-',
      bank:
        spk.pay_to_user && spk.pay_to_user.bank ? spk.pay_to_user.bank : null,
      bank_account_number:
        spk.pay_to_user && spk.pay_to_user.bank_account_number
          ? spk.pay_to_user.bank_account_number
          : null,
    },
    is_deleted: spk.deleted_at != null,
    category: {
      id: spk.category ? spk.category.id : null,
      name: spk.category ? spk.category.name : null,
    },
    subcategory: {
      id: spk.subcategory ? spk.subcategory.id : null,
      name: spk.subcategory ? spk.subcategory.name : null,
    },
    request_type: {
      id: spk.request_type ? spk.request_type.id : null,
      name: spk.request_type ? spk.request_type.name : null,
    },
  };
};

export const SPKOperationalResourceDetail = (
  spk: SPKOperational,
  remarkSuperadmin?: string,
): any => {
  if (spk.cost_evidences != null) {
    spk.cost_evidences.sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  if (spk.inhouse_team != null) {
    spk.inhouse_team.sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  return {
    id: spk.id,
    spk_number: spk.spk_number,
    spk_name: spk.name ? spk.name : '-',
    spk_description: spk.description ? spk.description : '-',
    spk_date: moment(spk.created_at).format('YYYY-MM-DD HH:mm:ss'),
    spk_status:
      spk.status != null && spk.status != undefined
        ? {
          status: spk.status,
          name:
            spk.status == SPKStatus.CREATED
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
                        : spk.status == SPKStatus.REJECTED
                          ? 'Rejected'
                          : '-',
        }
        : null,
    region: {
      id: spk.region && spk.region.id ? spk.region.id : null,
      name: spk.region && spk.region.name ? spk.region.name : '-',
    },
    cash_advance: spk.cash_advance,
    pay_to_user: {
      id: spk.pay_to_user && spk.pay_to_user.id ? spk.pay_to_user.id : null,
      name:
        spk.pay_to_user && spk.pay_to_user.name ? spk.pay_to_user.name : '-',
      bank:
        spk.pay_to_user && spk.pay_to_user.bank ? spk.pay_to_user.bank : null,
      bank_account_number:
        spk.pay_to_user && spk.pay_to_user.bank_account_number
          ? spk.pay_to_user.bank_account_number
          : null,
    },
    area: {
      id: spk.area && spk.area.id ? spk.area.id : null,
      name: spk.area && spk.area.name ? spk.area.name : '-',
    },
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
    cost_evidences: spk.cost_evidences
      ? spk.cost_evidences.map((costEvidence) => {
        return {
          id: costEvidence && costEvidence.id ? costEvidence.id : null,
          name: costEvidence && costEvidence.name ? costEvidence.name : '-',
          cost: costEvidence && costEvidence.cost ? costEvidence.cost : null,
          photo:
            costEvidence && costEvidence.cost_evidence_photo_file
              ? (String(costEvidence.cost_evidence_photo_file.path).startsWith("http") ? costEvidence.cost_evidence_photo_file.path : minioConfig().fullUrl + costEvidence.cost_evidence_photo_file.path)
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
    paid_date: spk.paidDateParseDate,
    closed_by: spk.closed_by_user ? spk.closed_by_user.name : '-',
    transfer_proof_photo: spk.transfer_proof_file
      ? (String(spk.transfer_proof_file.path).startsWith("http") ? spk.transfer_proof_file.path : minioConfig().fullUrl + spk.transfer_proof_file.path)
      : null,
    remark_pm: spk.remark_pm ? spk.remark_pm : '-',
    remark_rpm: spk.remark_rpm ? spk.remark_rpm : '-',
    remark_verificator: spk.remark_verificator ? spk.remark_verificator : '-',
    category: {
      id: spk.category && spk.category.id ? spk.category.id : null,
      name: spk.category && spk.category.name ? spk.category.name : '-',
    },
    subcategory: {
      id: spk.subcategory ? spk.subcategory.id : null,
      name: spk.subcategory ? spk.subcategory.name : null,
    },
    request_type: {
      id: spk.request_type && spk.request_type.id ? spk.request_type.id : null,
      name:
        spk.request_type && spk.request_type.name ? spk.request_type.name : '-',
    },
    remark_superadmin: remarkSuperadmin,
    customer: {
      id: spk.customer && spk.customer.id ? spk.customer.id : null,
      name: spk.customer && spk.customer.name ? spk.customer.name : '-',
    },
  };
};
