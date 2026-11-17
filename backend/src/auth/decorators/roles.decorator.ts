import { SetMetadata } from '@nestjs/common';

export type Role = 'employee' | 'hrd';

export const Roles = (...roles: Role[]) =>
  SetMetadata('roles', roles);