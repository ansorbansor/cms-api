import { EmployeePosition } from 'src/entities/employee-position.entity';

export const EmployeePositionResource = (
  employeePosition: EmployeePosition,
): any => {
  if (employeePosition) {
    return {
      id: employeePosition.id,
      name: employeePosition.name,
    };
  }

  return null;
};
