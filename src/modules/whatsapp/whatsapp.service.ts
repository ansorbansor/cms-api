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
    const puppeteerArgs = [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote'
    ];

    if (process.env.NODE_ENV !== 'local') {
      // Removed --single-process to prevent CPU spikes and memory leaks
      puppeteerArgs.push('--disable-gpu');
    }

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: puppeteerArgs,
        dumpio: false, // Set to false to prevent IO overhead
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

    this.client.on('disconnected', async (reason) => {
      this.logger.log('WhatsApp Client was disconnected', reason);
      this.isConnected = false;
      this.currentQrCodeUrl = null;
      try {
        await this.client.destroy();
      } catch (err) {}
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
      try {
        await this.client.destroy();
      } catch (err) {}
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
    
    // Keep max 500 logs
    if (this.messageLogs.length >= 500) this.messageLogs.shift();
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
      await this.client.sendMessage(targetJid, message, { linkPreview: false });
      this.logger.log(`Message sent successfully to ${targetJid}`);
      logEntry.status = 'Sent';
    } catch (error) {
      this.logger.error(`Failed to send message to ${targetJid}`, error);
      logEntry.status = `Error: ${error.message}`;
    }
  }

  async sendToGroupByName(groupName: string, message: string): Promise<boolean> {
    const logEntry = {
      id: this.logIdCounter++,
      to: `Group: ${groupName}`,
      message: message,
      status: 'Pending',
      time: new Date(),
    };
    
    if (this.messageLogs.length >= 500) this.messageLogs.shift();
    this.messageLogs.push(logEntry);

    if (!this.isConnected) {
      this.logger.warn('Tried to send message to group, but WhatsApp client is not connected.');
      logEntry.status = 'Failed (Not Connected)';
      return false;
    }

    let chats;
    try {
      chats = await this.client.getChats();
    } catch (e) {
      this.logger.error(`Error during getChats() for group "${groupName}"`, e);
      logEntry.status = `Error: getChats - ${e.message}`;
      return false;
    }

    try {
      const groupChat = chats.find(c => c.isGroup && c.name === groupName);

      if (!groupChat) {
        this.logger.error(`Group with name "${groupName}" not found.`);
        logEntry.status = 'Error: Group not found';
        return false;
      }

      this.logger.log(`Found group "${groupName}" with ID: ${groupChat.id._serialized}`);

      const hydratedChat = await this.client.getChatById(groupChat.id._serialized);
      await hydratedChat.sendMessage(message, { linkPreview: false });
      
      this.logger.log(`Message sent successfully to group "${groupName}"`);
      logEntry.status = 'Sent';
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to group "${groupName}" during sendMessage`, error);
      logEntry.status = `Error: ${error.message}`;
      return false;
    }
  }
}
