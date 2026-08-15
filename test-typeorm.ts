import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SPKService } from './src/modules/spk/spk.service';
import { User } from './src/entities/user.entity';
import { SPKStatus } from './src/utils/enums';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const spkService = app.get(SPKService);
  
  // mock user
  const user = { id: 1 } as User;
  
  const queryBuilder = spkService['spkRepository'].createQueryBuilder('spk').whereInIds([22950]).leftJoinAndSelect('spk.po', 'po');
  queryBuilder.andWhere('spk.status = :status', { status: SPKStatus.APPROVED });
  queryBuilder.andWhere('spk.is_over_budget = true');
  
  console.log("SQL:", queryBuilder.getSql());
  console.log("PARAMS:", queryBuilder.getParameters());
  
  const items = await queryBuilder.getMany();
  console.log("ITEMS FOUND:", items.length);
  
  await app.close();
}
bootstrap();
