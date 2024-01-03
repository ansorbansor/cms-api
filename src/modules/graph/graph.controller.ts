import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/utils/guards';
import {
  successResponse,
  successResponseList,
  successResponseListWithoutPaginate,
} from 'src/utils/responses';
import { GraphService } from './graph.service';

@ApiBearerAuth()
@ApiTags('Graph')
@Controller({
  path: 'graph',
  version: '1',
})
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  // #3
  @Get('po/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async poCount(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getPOCount(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #4
  @Get('po/line-amount/sum')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getPOLineAmount(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getPOLineAmount(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #6
  @Get('po/count-per-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async poCountPerStatus(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponseListWithoutPaginate(
      await this.graphService.getPOCountPerStatus(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #1
  @Get('po/actual-work-amount/sum')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getActualWorkAmountSum(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getActualWorkAmountSum(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #8
  @Get('po/contract-asset/sum')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getContractAssetSum(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getContractAssetSum(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #5
  @Get('po/actual-work-amount/per-month')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getActualWorkAmountPerMonth(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getActualWorkAmountPerMonth(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #7
  @Get('po/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getOrderLog(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return successResponseList(
      await this.graphService.getOrderLog(
        {
          page,
          limit,
          total: 0,
        },
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // dashboard management
  // #1
  @Get('management/actual-work-amount/per-month')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getManagementActualWorkAmountPerMonth(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getManagementActualWorkAmountPerMonth(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #2
  @Get('management/invoice-performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getManagementInvoicePerformance(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getManagementInvoicePerformance(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }

  // #3
  @Get('management/current-asset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getManagementCurrentAsset(
    @Query('status') status: string,
    @Query('region_id') regionId: number,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('line_po_status') linePOStatus: string,
    @Query('customer_id') customerId: number,
  ) {
    return successResponse(
      await this.graphService.getManagementCurrentAsset(
        status,
        regionId,
        month,
        year,
        linePOStatus,
        customerId,
      ),
      'success',
    );
  }
}
