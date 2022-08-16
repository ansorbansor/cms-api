/* eslint-disable prettier/prettier */

import { Provider } from "src/entities/provider.entity";

export const ProviderResource = (provider: Provider): any => {
  return {
    id: provider.id,
    name: provider.name,
    fetch_data: provider.fetch_data,
    photo: provider.photo,
    last_update: provider.last_update,
    url: provider.url,
  };
};
