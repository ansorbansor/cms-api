import { PD } from 'src/entities/pd.entity';

export const PDResource = (pd: PD): any => {
  return {
    id: pd.id,
    name: pd.name,
  };
};
