import { EmployeeUnit } from 'src/entities/employee-unit.entity';

export const MasterEmployeeUnitResource = (employeeUnit: EmployeeUnit): any => {
  if (employeeUnit) {
    return {
      id: employeeUnit.id,
      nama_unit: employeeUnit.name,
    };
  }

  return null;
};
