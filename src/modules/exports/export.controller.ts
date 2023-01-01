import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExportService } from './export.service';

@ApiBearerAuth()
@ApiTags('Exports')
@Controller({
  path: 'export',
  version: '1',
})
export class ExportController {
  constructor(private readonly exportService: ExportService) {}
}
