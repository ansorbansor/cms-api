import { EmployeeLevel } from 'src/entities/employee-level.entity';

export const MasterEmployeeLevelResource = (
  employeeLevel: EmployeeLevel,
): any => {
  if (employeeLevel) {
    return {
      id: employeeLevel.id,
      nama_pangkat: employeeLevel.name,
    };
  }

  return null;
};
