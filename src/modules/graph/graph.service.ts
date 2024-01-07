import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository, getManager } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import {
  GraphGlobalResource,
  GraphOrderListResource,
  ActualWorkAmountPerMonthResource,
} from './resources/graph.resources';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { SPKStatus } from 'src/utils/enums';
import { find } from 'rxjs';

@Injectable()
export class GraphService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
  ) {}

  // #3
  async getPOCount(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    let poCount = await getManager().query(
      `SELECT COUNT(1) FROM purchase_orders WHERE deleted_at IS NULL ${whereQuery}`,
      whereParam,
    );

    if (poCount.length > 0 && poCount[0].count != null) {
      poCount = poCount[0].count;
    } else {
      poCount = 0;
    }

    return {
      po_count: poCount,
    };
  }

  // #4
  async getPOLineAmount(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    let lineAmount = await getManager().query(
      `SELECT SUM(line_amount) FROM purchase_orders WHERE deleted_at IS NULL ${whereQuery}`,
      whereParam,
    );

    if (lineAmount.length > 0 && lineAmount[0].sum != null) {
      lineAmount = lineAmount[0].sum;
    } else {
      lineAmount = 0;
    }

    return {
      line_amount: lineAmount,
    };
  }

  // #6
  async getPOCountPerStatus(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.publish_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    const poCount = await getManager().query(
      `SELECT COUNT(1), status FROM purchase_orders WHERE deleted_at IS NULL ${whereQuery} GROUP BY status`,
      whereParam,
    );

    return poCount;
  }

  // #1
  async getActualWorkAmountSum(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    let actualWorkAmount = await getManager().query(
      `SELECT SUM(actual_work_amount) FROM purchase_orders WHERE deleted_at IS NULL ${whereQuery}`,
      whereParam,
    );

    if (actualWorkAmount.length > 0 && actualWorkAmount[0].sum != null) {
      actualWorkAmount = actualWorkAmount[0].sum;
    } else {
      actualWorkAmount = 0;
    }

    return {
      actual_work_amount: actualWorkAmount,
    };
  }

  // #5
  async getActualWorkAmountPerMonth(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    const actualWorkAmountPerMonth = await getManager().query(
      `WITH months AS (SELECT * FROM generate_series(1, 12) AS t(n))
      SELECT
        to_char(to_timestamp (m.n::text, 'MM'), 'Mon') AS mon,
        SUM ( actual_work_amount ),
        status
      FROM
      months m LEFT JOIN
        purchase_orders
        ON EXTRACT(MONTH from purchase_orders.actual_work_date) = m.n 
      WHERE
        deleted_at IS NULL 
        ${whereQuery}
      GROUP BY
        mon, status, m.n
      ORDER BY m.n ASC`,
      whereParam,
    );

    const allStatus = await getManager().query(
      `SELECT
        status
      FROM
        purchase_orders
      WHERE
        deleted_at IS NULL
      GROUP BY
        status`,
      whereParam,
    );

    const filtered = [];
    actualWorkAmountPerMonth.map((data) => {
      const findData = filtered.find((f) => {
        return f.mon === data.mon;
      });

      if (!findData) {
        filtered.push(data);
      }
    });

    const returnedData = filtered.map((data) => {
      return ActualWorkAmountPerMonthResource(
        data,
        allStatus,
        actualWorkAmountPerMonth,
      );
    });

    return returnedData;
  }

  // #8
  async getContractAssetSum(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    let contractAsset = await getManager().query(
      `SELECT SUM(piutang) FROM purchase_orders WHERE deleted_at IS NULL ${whereQuery}`,
      whereParam,
    );

    if (contractAsset.length > 0 && contractAsset[0].sum != null) {
      contractAsset = contractAsset[0].sum;
    } else {
      contractAsset = 0;
    }

    return {
      contract_asset: contractAsset,
    };
  }

  // #7
  async getOrderLog(
    paginationOptions: IPaginationOptions,
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    const data = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.site', 'site')
      .leftJoinAndSelect('po.project', 'project')
      .leftJoinAndSelect('po.bidding_area', 'bidding_area');

    if (regionId != undefined && regionId != null && regionId != 0) {
      data.andWhere('po.region_id = :region_id', {
        region_id: regionId,
      });
    }

    if (month != '' && month != null) {
      data.andWhere('EXTRACT(MONTH FROM po.publish_date) = :month', {
        month: month,
      });
    }

    if (year != '' && year != null) {
      data.andWhere('EXTRACT(YEAR FROM po.publish_date) = :year', {
        year: year,
      });
    }

    if (linePOStatus != '' && linePOStatus != null) {
      data.andWhere('po.line_po_status = :linePOStatus', {
        linePOStatus: linePOStatus,
      });
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      data.andWhere('po.customer_id = :customerId', {
        customerId: customerId,
      });
    }

    if (status != '' && status != null) {
      data.andWhere('po.status = :status', {
        status: status,
      });
    }

    data.orderBy('po.publish_date', 'DESC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = 50;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      GraphOrderListResource,
      paginationOptions,
    );
  }

  // dashboard management
  // #1
  async getManagementActualWorkAmountPerMonth(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    const actualWorkAmountPerMonth = await getManager().query(
      `
      WITH months AS (SELECT * FROM generate_series(1, 12) AS t(n))
      SELECT
        to_char(to_timestamp (m.n::text, 'MM'), 'Mon') AS mon,
        COALESCE(SUM ( purchase_orders.actual_work_amount ), 0) AS sum
      FROM
        months m LEFT JOIN
        purchase_orders
        ON EXTRACT(MONTH from purchase_orders.actual_work_date) = m.n
      WHERE
        purchase_orders.deleted_at IS NULL
        ${whereQuery}
      GROUP BY
        mon, m.n
      ORDER BY m.n ASC`,
      whereParam,
    );

    const returnedData = actualWorkAmountPerMonth.map((data) => {
      return GraphGlobalResource(data);
    });

    return returnedData;
  }

  // #2
  async getManagementInvoicePerformance(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND po.region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM poi.invoice_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM poi.invoice_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery + ' AND po.line_po_status = $' + (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery + ' AND po.customer_id = $' + (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery = whereQuery + ' AND po.status = $' + (whereParam.length + 1);
      whereParam.push(status);
    }

    const actualWorkAmountPerMonth = await getManager().query(
      `WITH months AS (SELECT * FROM generate_series(1, 12) AS t(n))

      SELECT
        to_char(to_timestamp (m.n::text, 'MM'), 'Mon') AS mon,
        COALESCE(SUM ( poi.approve_amount ), 0) AS sum
      FROM
        months m LEFT JOIN
        purchase_order_invoices poi
        ON EXTRACT(MONTH from poi.invoice_date) = m.n
        LEFT JOIN
        purchase_orders po
        ON poi.purchase_order_id = po.id
      WHERE
        poi.deleted_at IS NULL 
        AND po.deleted_at IS NULL
        ${whereQuery}
      GROUP BY
        mon, m.n
      ORDER BY
        m.n ASC`,
      whereParam,
    );

    const returnedData = actualWorkAmountPerMonth.map((data) => {
      return GraphGlobalResource(data);
    });

    return returnedData;
  }

  // #3
  async getManagementCurrentAsset(
    status: string,
    regionId: number,
    month: string,
    year: string,
    linePOStatus: string,
    customerId: number,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM purchase_orders.actual_work_date) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    if (linePOStatus != '' && linePOStatus != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.line_po_status = $' +
        (whereParam.length + 1);
      whereParam.push(linePOStatus);
    }

    if (customerId != undefined && customerId != null && customerId != 0) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.customer_id = $' +
        (whereParam.length + 1);
      whereParam.push(customerId);
    }

    if (status != '' && status != null) {
      whereQuery =
        whereQuery +
        ' AND purchase_orders.status = $' +
        (whereParam.length + 1);
      whereParam.push(status);
    }

    const sumResult = await getManager().query(
      `SELECT 
        SUM(ny_invoice) AS sum_ny_invoice,
        SUM(piutang) AS sum_piutang
      FROM
        purchase_orders
      WHERE
        deleted_at IS NULL ${whereQuery}`,
      whereParam,
    );

    let sumNYInvoice = 0;
    let sumPiutang = 0;

    if (sumResult.length > 0 && sumResult[0].sum_ny_invoice != null) {
      sumNYInvoice = sumResult[0].sum_ny_invoice;
    } else {
      sumNYInvoice = 0;
    }

    if (sumResult.length > 0 && sumResult[0].sum_piutang != null) {
      sumPiutang = sumResult[0].sum_piutang;
    } else {
      sumPiutang = 0;
    }

    const allSum = Number(sumPiutang) + Number(sumNYInvoice);

    if (allSum == 0) {
      return [];
    }

    return [
      {
        name: 'NY invoice',
        value: Math.round((sumNYInvoice / allSum) * 100),
      },
      {
        name: 'Piutang',
        value: Math.round((sumPiutang / allSum) * 100),
      },
    ];
  }

  // #4
  async getNettIncome(
    status: string,
    regionId: number,
    month: string,
    year: string,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND spk.region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM spk.created_at) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM spk.created_at) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    const actualWorkAmountPerMonth = await getManager().query(
      `WITH months AS (SELECT * FROM generate_series(1, 12) AS t(n))

      SELECT
        to_char(to_timestamp (m.n::text, 'MM'), 'Mon') AS mon,
        COALESCE(SUM ( spk.cash_advance ), 0) AS sum
      FROM
        months m LEFT JOIN
        spk
        ON EXTRACT(MONTH from spk.created_at) = m.n
      WHERE
        spk.deleted_at IS NULL
        AND spk.status != ${SPKStatus.REJECTED}
        ${whereQuery}
      GROUP BY
        mon, m.n
      ORDER BY
        m.n ASC`,
      whereParam,
    );

    const returnedData = actualWorkAmountPerMonth.map((data) => {
      return GraphGlobalResource(data);
    });

    return returnedData;
  }

  // #5
  async getLiability(
    status: string,
    regionId: number,
    month: string,
    year: string,
  ) {
    let whereQuery = '';
    const whereParam = [];

    if (regionId != undefined && regionId != null && regionId != 0) {
      whereQuery = ' AND spk.region_id = $' + (whereParam.length + 1);
      whereParam.push(regionId);
    }

    if (month != '' && month != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(MONTH FROM spk.created_at) = $' +
        (whereParam.length + 1);
      whereParam.push(month);
    }

    if (year != '' && year != null) {
      whereQuery =
        whereQuery +
        ' AND EXTRACT(YEAR FROM spk.created_at) = $' +
        (whereParam.length + 1);
      whereParam.push(year);
    }

    let liability = await getManager().query(
      ` SELECT
          COALESCE(SUM ( spk.cash_advance ), 0) AS sum
        FROM
          spk
        WHERE
          spk.deleted_at IS NULL
          AND (
            spk.status = 0
            OR spk.status = 1
            OR spk.status = 2
            OR spk.status = 3
          ) ${whereQuery}`,
      whereParam,
    );

    if (liability.length > 0 && liability[0].sum != null) {
      liability = liability[0].sum;
    } else {
      liability = 0;
    }

    if (liability == 0) {
      return [];
    }

    return [
      {
        name: 'Liability',
        value: Number(liability),
      },
    ];
  }
}
