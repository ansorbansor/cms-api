import { OauthClient } from 'src/entities/oauth-client.entity';

export const GeneratePartnerResource = (partner: OauthClient): any => {
  return {
    name: partner.name,
    client_id: partner.id,
    client_secret: partner.secret,
  };
};
