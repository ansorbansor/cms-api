import { EmployeePosition } from 'src/entities/employee-position.entity';

export const EmployeePositionResource = (
  employeePosition: EmployeePosition,
): any => {
  if (employeePosition) {
    return {
      id: employeePosition.id,
      name: employeePosition.name,
      code: employeePosition.code,
      grant_all_access: employeePosition.grant_all_access,
      sub_roles: employeePosition.sub_roles || [],
    };
  }

  return null;
};
