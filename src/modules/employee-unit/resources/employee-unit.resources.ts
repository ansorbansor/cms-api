import { EmployeeUnit } from 'src/entities/employee-unit.entity';

export const EmployeeUnitResource = (employeeUnit: EmployeeUnit): any => {
  if (employeeUnit) {
    return {
      id: employeeUnit.id,
      name: employeeUnit.name,
    };
  }

  return null;
};
