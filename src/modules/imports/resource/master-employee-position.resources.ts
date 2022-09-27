import { EmployeePosition } from 'src/entities/employee-position.entity';

export const MasterEmployeePositionResource = (
  employeePosition: EmployeePosition,
): any => {
  if (employeePosition) {
    return {
      id: employeePosition.id,
      nama_jabatan: employeePosition.name,
    };
  }

  return null;
};
