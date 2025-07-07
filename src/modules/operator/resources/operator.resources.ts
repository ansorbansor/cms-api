import { Operator } from 'src/entities/operator.entity';

export const OperatorResource = (operator: Operator): any => {
  return {
    id: operator.id,
    name: operator.name,
  };
};
