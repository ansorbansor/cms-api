import { StatusAcceptance } from 'src/entities/status-acceptance.entity';

export const StatusAcceptanceResource = (
  statusAcceptance: StatusAcceptance,
): any => {
  return {
    id: statusAcceptance.id,
    name: statusAcceptance.name,
  };
};
