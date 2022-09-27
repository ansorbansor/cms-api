/* eslint-disable prettier/prettier */

import { Provider } from "src/entities/provider.entity";

export const MasterProviderResource = (provider: Provider): any => {
  return {
    id: provider.id,
    nama_penyelenggara: provider.name,
  };
};
