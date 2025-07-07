import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: number[]) => SetMetadata('roles', roles);
export const Menus = (...menu: string[]) => SetMetadata('menus', menu);
