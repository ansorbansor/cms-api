import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [FeatureFlagsController],
})
export class FeatureFlagsModule {}
