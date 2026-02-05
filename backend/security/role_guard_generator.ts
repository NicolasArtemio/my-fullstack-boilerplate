import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const RoleGuardGeneratorSchema = z.object({
    rolesEnumName: z.string().default('UserRole').describe('Name of the role enum, e.g. UserRole, AppRoles'),
    defaultRoles: z.array(z.string()).default(['admin', 'user']).describe('List of roles to include in the enum'),
    jwtPayloadType: z.string().default('JwtPayload').describe('The interface name for JWT payload'),
});

const handler = async (args: z.infer<typeof RoleGuardGeneratorSchema>): Promise<SkillResult> => {
    const { rolesEnumName, defaultRoles, jwtPayloadType } = args;

    // 1. Generate the Decorator
    const decoratorCode = `import { SetMetadata } from '@nestjs/common';
import { ${rolesEnumName} } from './roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ${rolesEnumName}[]) => SetMetadata(ROLES_KEY, roles);
`;

    // 2. Generate the Enum
    const enumCode = `export enum ${rolesEnumName} {
${defaultRoles.map(r => `  ${r.toUpperCase()} = '${r}',`).join('\n')}
}`;

    // 3. Generate the Guard
    const guardCode = `import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, ${rolesEnumName} } from './roles.decorator';
import { ${jwtPayloadType} } from '../auth/interfaces/jwt-payload.interface'; // Adjust path as needed

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<${rolesEnumName}[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, access granted (or rely on jwt guard)
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
        throw new ForbiddenException('No user attached to request. Ensure JwtAuthGuard is running before RolesGuard.');
    }
    
    // Logic: User must have at least one of the required roles
    // Adjust 'user.role' based on your actual JWT structure
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    return hasRole;
  }
}
`;

    return {
        success: true,
        data: {
            'roles.enum.ts': enumCode,
            'roles.decorator.ts': decoratorCode,
            'roles.guard.ts': guardCode
        },
        metadata: {
            guardName: 'RolesGuard',
            strategies: ['jwt', 'reflector']
        }
    };
};

export const roleGuardGeneratorSkillDefinition: SkillDefinition<typeof RoleGuardGeneratorSchema> = {
    name: 'role_guard_generator',
    description: 'Generates NestJS RolesGuard, Decorator, and Enum for RBAC.',
    parameters: RoleGuardGeneratorSchema,
    handler,
};
