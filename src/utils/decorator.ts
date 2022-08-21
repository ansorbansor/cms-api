import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: number[]) => SetMetadata('roles', roles);
export const Controllers = (...controllers: string[]) =>
  SetMetadata('controllers', controllers);
export const Permissions = (...permissions: number[]) =>
  SetMetadata('permissions', permissions);
