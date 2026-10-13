import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { successResponse } from 'src/utils/responses';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'invoices', version: '1' })
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('eligible-pos')
  async getEligiblePOs(@Query('search') search?: string) {
    const data = await this.invoicesService.getEligiblePOs(search);
    return successResponse(data, 'Daftar PO yang siap di-invoice berhasil dimuat');
  }

  @Get('history')
  async getInvoiceHistory(@Query('po_number') poNumber?: string) {
    const data = await this.invoicesService.getInvoiceHistory(poNumber);
    return successResponse(data, 'Riwayat invoice berhasil dimuat');
  }

  @Get('check-number')
  async checkInvoiceNumber(
    @Query('invoice_number') invoiceNumber: string,
    @Query('po_number') poNumber?: string,
  ) {
    const data = await this.invoicesService.checkInvoiceNumber(invoiceNumber, poNumber);
    return successResponse(data, 'Pemeriksaan nomor invoice resmi berhasil');
  }

  @Get('preview/:po_number')
  async getInvoicePreview(
    @Param('po_number') poNumber: string,
    @Query('invoice_date') invoiceDate?: string,
    @Query('invoice_number') invoiceNumber?: string,
    @Query('milestone_pct') milestonePct?: number,
    @Query('term_label') termLabel?: string,
  ) {
    const data = await this.invoicesService.getInvoicePreview(poNumber, {
      invoice_date: invoiceDate,
      invoice_number: invoiceNumber,
      milestone_pct: milestonePct ? Number(milestonePct) : undefined,
      term_label: termLabel,
    });
    return successResponse(data, 'Preview invoice berhasil di-generate');
  }

  @Post('save')
  async saveInvoice(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    const data = await this.invoicesService.saveInvoice({
      ...body,
      user_id: userId,
    });
    return successResponse(data, 'Invoice berhasil disimpan ke riwayat');
  }
}
