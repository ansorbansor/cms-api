import { HttpStatus, Injectable } from '@nestjs/common';
import { failedResponse } from 'src/utils/responses';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { OauthClient } from 'src/entities/oauth-client.entity';

@Injectable()
export class OauthClientService {
  constructor(
    @InjectRepository(OauthClient)
    private oauthClientRepository: Repository<OauthClient>,
  ) {}

  async validateClient(id: number, secret: string) {
    const client = await getManager().query(
      `SELECT * FROM oauth_clients WHERE id = ${id} AND secret = '${secret}'`,
    );

    if (!client) {
      throw failedResponse(HttpStatus.UNAUTHORIZED, 'Client tidak tersedia');
    }

    return client;
  }
}
