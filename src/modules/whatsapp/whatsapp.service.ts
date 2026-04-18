import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private readonly logger = new Logger(WhatsappService.name);
  private currentQrCodeUrl: string | null = null;
  private isConnected: boolean = false;
  private messageLogs: { id: number, to: string, message: string, status: string, time: Date }[] = [];
  private logIdCounter: number = 1;

  async onModuleInit() {
    this.logger.log('Initializing WhatsApp Client...');
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        dumpio: true,
      }
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`LOADING SCREEN: ${percent}% - ${message}`);
    });

    this.client.on('qr', async (qr) => {
      this.logger.log('QR Code received, waiting to be scanned...');
      this.isConnected = false;
      try {
        this.currentQrCodeUrl = await qrcode.toDataURL(qr);
      } catch (err) {
        this.logger.error('Failed to generate QR code data URL', err);
      }
    });

    this.client.on('ready', () => {
      this.logger.log('WhatsApp Client is ready!');
      this.isConnected = true;
      this.currentQrCodeUrl = null;
    });

    this.client.on('authenticated', () => {
      this.logger.log('WhatsApp Client Authenticated');
    });

    this.client.on('auth_failure', msg => {
      this.logger.error('WhatsApp Authentication failure', msg);
      this.isConnected = false;
      this.currentQrCodeUrl = null;
    });

    this.client.on('disconnected', (reason) => {
      this.logger.log('WhatsApp Client was disconnected', reason);
      this.isConnected = false;
      this.currentQrCodeUrl = null;
      this.client.initialize();
    });

    try {
      await this.client.initialize();
    } catch (e) {
      this.logger.error('Failed to initialize client', e);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Destroying WhatsApp Client...');
    if (this.client) {
      try {
        await this.client.destroy();
      } catch(e) { }
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      qr: this.currentQrCodeUrl,
      logs: this.messageLogs,
    };
  }

  async logout() {
    this.logger.log('Logging out from WhatsApp...');
    if (this.client && this.isConnected) {
      try {
        await this.client.logout();
      } catch(e) {
        this.logger.error('Error during logout', e);
      }
      this.isConnected = false;
      this.currentQrCodeUrl = null;
      // Usually logging out crashes/kills the puppeteer instance in whatsapp-web.js, 
      // requiring a re-initialization.
      this.client.initialize(); 
    }
    return { success: true };
  }

  async sendMessage(phone: string, message: string) {
    const logEntry = {
      id: this.logIdCounter++,
      to: phone,
      message: message,
      status: 'Pending',
      time: new Date(),
    };
    
    // Keep max 50 logs
    if (this.messageLogs.length >= 50) this.messageLogs.shift();
    this.messageLogs.push(logEntry);

    if (!this.isConnected) {
      this.logger.warn('Tried to send message, but WhatsApp client is not connected.');
      logEntry.status = 'Failed (Not Connected)';
      return;
    }
    
    let formattedPhone = phone.replace(/^\+/, '').replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }
    const targetJid = `${formattedPhone}@c.us`;

    try {
      await this.client.sendMessage(targetJid, message);
      this.logger.log(`Message sent successfully to ${targetJid}`);
      logEntry.status = 'Sent';
    } catch (error) {
      this.logger.error(`Failed to send message to ${targetJid}`, error);
      logEntry.status = `Error: ${error.message}`;
    }
  }
}
