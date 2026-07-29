import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SPK } from 'src/entities/spk.entity';
import { SPKOperational } from 'src/entities/spk-operationals.entity';
import { google } from 'googleapis';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { readFeatureFlags } from 'src/utils/feature-flags.util';
import * as path from 'path';

@Injectable()
export class SpkGoogleSheetCronService {
  private readonly logger = new Logger(SpkGoogleSheetCronService.name);

  constructor(
    @InjectRepository(SPK)
    private readonly spkRepository: Repository<SPK>,
    @InjectRepository(SPKOperational)
    private readonly spkOperationalRepository: Repository<SPKOperational>,
  ) {}

  @Cron('0 21 * * *') // Run daily at 21:00
  async handleCron() {
    this.logger.log('Starting Google Sheet SPK Bot check...');
    await this.processGoogleSheets();
  }

  async processGoogleSheets() {
    const flags = readFeatureFlags();
    let sheetLinks = flags.spk_bot_sheet_links || [];
    
    if (typeof sheetLinks === 'string') {
      sheetLinks = sheetLinks.split('\n').map(l => l.trim()).filter(l => l);
    }

    if (!sheetLinks || sheetLinks.length === 0) {
      this.logger.warn('No Google Sheet links configured in feature flags.');
      return { success: false, message: 'No links configured' };
    }

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'quantum-ether-385618-440b8d3d4086.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      const token = tokenResponse.token;

      let processedSheets = 0;
      let totalUpdates = 0;

      for (const link of sheetLinks) {
        if (!link.trim()) continue;
        const updates = await this.processSingleSheet(link, token);
        if (updates !== null) {
          processedSheets++;
          totalUpdates += updates;
        }
      }
      this.logger.log(`Google Sheet SPK Bot check completed. Processed ${processedSheets} sheets, made ${totalUpdates} updates.`);
      return { success: true, processedSheets, totalUpdates };
    } catch (error) {
      this.logger.error(`Error in Google Sheet Bot: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  private async processSingleSheet(link: string, token: string): Promise<number | null> {
    let updates = 0;
    try {
      this.logger.log(`Processing sheet: ${link}`);
      
      const matchId = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const matchGid = link.match(/[#&]gid=([0-9]+)/);

      if (!matchId || !matchId[1]) {
        this.logger.error(`Invalid Google Sheet URL: ${link}`);
        return null;
      }

      const spreadsheetId = matchId[1];
      const gid = matchGid ? matchGid[1] : '0';

      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
      
      const response = await axios.get(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text',
      });

      const records = parse(response.data, {
        skip_empty_lines: true,
        relax_quotes: true,
      });

      if (records.length < 2) return 0;

      const headers = records[1];
      const spkIndex = headers.indexOf('No. SPK/SPKO');
      const statusIndex = headers.indexOf('Status Transfer');

      if (spkIndex === -1 || statusIndex === -1) {
        this.logger.error(`Required columns not found in sheet: ${link}`);
        return 0;
      }

      for (let i = 2; i < records.length; i++) {
        const row = records[i];
        const spkNumber = row[spkIndex]?.trim();
        const statusTransfer = row[statusIndex]?.trim();

        if (spkNumber && statusTransfer === 'DONE TRANSFER') {
          const updated = await this.updateSpkStatus(spkNumber);
          if (updated) updates++;
        }
      }
      return updates;
    } catch (error) {
      this.logger.error(`Error processing sheet ${link}: ${error.message}`);
      return null;
    }
  }

  private async updateSpkStatus(spkNumber: string): Promise<boolean> {
    let updated = false;

    const spk = await this.spkRepository.findOne({ where: { spk_number: spkNumber } });
    if (spk && spk.status < 4) {
      spk.status = 4;
      spk.approved_by = 1113;
      spk.remark_rpm = 'Automated Approved by RPM on googlesheet';
      await this.spkRepository.save(spk);
      this.logger.log(`Updated SPK ${spkNumber}`);
      updated = true;
    }

    const spko = await this.spkOperationalRepository.findOne({ where: { spk_number: spkNumber } });
    if (spko && spko.status < 4) {
      spko.status = 4;
      spko.approved_by = 1113;
      spko.remark_rpm = 'Automated Approved by RPM on googlesheet';
      await this.spkOperationalRepository.save(spko);
      this.logger.log(`Updated SPK Operational ${spkNumber}`);
      updated = true;
    }

    return updated;
  }
}
