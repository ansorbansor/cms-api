import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtpService } from './atp.service';
import { AtpController } from './atp.controller';
import { AtpTemplate } from '../../entities/atp-template.entity';
import { AtpTemplateSection } from '../../entities/atp-template-section.entity';
import { AtpTemplateItem } from '../../entities/atp-template-item.entity';
import { AtpDocument } from '../../entities/atp-document.entity';
import { AtpDocumentValue } from '../../entities/atp-document-value.entity';
import { AtpDocumentReview } from '../../entities/atp-document-review.entity';
import { SiteTakeDataAssignment } from '../../entities/site-take-data-assignment.entity';
import { TakeDataSubmission } from '../../entities/take-data-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AtpTemplate,
      AtpTemplateSection,
      AtpTemplateItem,
      AtpDocument,
      AtpDocumentValue,
      AtpDocumentReview,
      SiteTakeDataAssignment,
      TakeDataSubmission,
    ]),
  ],
  controllers: [AtpController],
  providers: [AtpService],
  exports: [AtpService],
})
export class AtpModule {}
