import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TakeDataService } from './take-data.service';
import { TakeDataController } from './take-data.controller';
import { TakeDataTemplate } from '../../entities/take-data-template.entity';
import { TakeDataTemplateItem } from '../../entities/take-data-template-item.entity';
import { SiteTakeDataAssignment } from '../../entities/site-take-data-assignment.entity';
import { TakeDataSubmission } from '../../entities/take-data-submission.entity';
import { FilesModule } from '../files/files.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TakeDataTemplate,
            TakeDataTemplateItem,
            SiteTakeDataAssignment,
            TakeDataSubmission,
        ]),
        FilesModule,
    ],
    controllers: [TakeDataController],
    providers: [TakeDataService],
})
export class TakeDataModule { }
