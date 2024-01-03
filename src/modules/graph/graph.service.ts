import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'src/utils/types';
import { Repository, getManager } from 'typeorm';
import { infinityPagination } from 'src/utils/responses';
import {
  ActualWorkAmountPerMonthResource,
  GraphOrderListResource,
  GraphResource,
} from './resources/graph.resources';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';

@Injectable()
export class GraphService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
  ) {}

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
      `SELECT
        to_char( actual_work_date, 'Mon' ) AS mon,
        SUM ( actual_work_amount ),
        status
      FROM
        purchase_orders 
      WHERE
        deleted_at IS NULL 
        AND actual_work_date IS NOT NULL 
        ${whereQuery}
      GROUP BY
        mon, status
      ORDER BY mon DESC`,
      whereParam,
    );

    const returnedData = actualWorkAmountPerMonth.map((data) => {
      return ActualWorkAmountPerMonthResource(data);
    });

    return returnedData;
  }

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

  async findManyWithPagination(paginationOptions: IPaginationOptions) {
    const data = this.poRepository.createQueryBuilder('customer');

    if (paginationOptions.search) {
      data.andWhere('customer.name ILIKE :search', {
        search: `%${paginationOptions.search}%`,
      });
    }

    data.orderBy('customer.name', 'ASC');

    const total = await data.getCount();
    paginationOptions.total = total;

    if (!paginationOptions.limit) {
      paginationOptions.limit = total;
    }

    data.skip((paginationOptions.page - 1) * paginationOptions.limit);
    data.take(paginationOptions.limit);

    return infinityPagination(
      await data.getMany(),
      GraphResource,
      paginationOptions,
    );
  }
}
