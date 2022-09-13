import { EmployeeLevel } from 'src/entities/employee-level.entity';

export const EmployeeLevelResource = (employeeLevel: EmployeeLevel): any => {
  if (employeeLevel) {
    return {
      id: employeeLevel.id,
      name: employeeLevel.name,
    };
  }

  return null;
};
