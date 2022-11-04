import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PKASNProgram } from 'src/entities/pkasn-program.entity';
import { PKASNProgramController } from './pkasn-program.controller';
import { PKASNProgramService } from './pkasn-program.service';

@Module({
  imports: [TypeOrmModule.forFeature([PKASNProgram])],
  controllers: [PKASNProgramController],
  providers: [PKASNProgramService],
  exports: [PKASNProgramService],
})
export class PKASNProgramModule {}
