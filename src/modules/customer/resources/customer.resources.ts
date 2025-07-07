import { Customer } from 'src/entities/customer.entity';

export const CustomerResource = (customer: Customer): any => {
  return {
    id: customer.id,
    name: customer.name,
  };
};
