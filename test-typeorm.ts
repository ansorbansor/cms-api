import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SPKService } from './src/modules/spk/spk.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const spkService = app.get(SPKService);
  
  const items = await spkService['spkRepository'].createQueryBuilder('spk')
      .where('spk.id IN (:...ids)', { ids: [22907] })
      .getMany();
      
  console.log(items.map(i => ({ id: i.id, status: i.status, is_over_budget: i.is_over_budget, type: typeof i.is_over_budget })));
  
  await app.close();
}
bootstrap();
