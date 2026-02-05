import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const AccessListManagerSchema = z.object({
    type: z.enum(['whitelist', 'blacklist']).describe('The type of filtering: accept only listed IPs or reject listed IPs'),
    ips: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address format')).describe('List of IP addresses to filter'),

    action: z.enum(['allow', 'deny', 'log_only']).default('deny').describe('Action to take when a match is found (or not found in case of whitelist)'),
});

const handler = async (args: z.infer<typeof AccessListManagerSchema>): Promise<SkillResult> => {
    const { type, ips, action } = args;

    const guardName = type === 'whitelist' ? 'IpWhitelistGuard' : 'IpBlacklistGuard';
    const ipsString = JSON.stringify(ips);

    const code = `import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ${guardName} implements CanActivate {
  private readonly logger = new Logger(${guardName}.name);
  private readonly restrictedIps = ${ipsString};

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = request.ip || request.connection.remoteAddress;

    if (!clientIp) {
      this.logger.warn('Could not determine client IP');
      return false; // Fail safe
    }

    ${type === 'whitelist' ? `
    // Whitelist Logic: Allow ONLY if in list
    const isAllowed = this.restrictedIps.includes(clientIp);
    if (!isAllowed) {
      ${action === 'log_only' ? `
      this.logger.warn(\`Access from unauthorized IP: \${clientIp}\`);
      return true;
      ` : `
      this.logger.warn(\`Blocked access from unauthorized IP: \${clientIp}\`);
      throw new ForbiddenException('Access denied from your IP address');
      `}
    }
    return true;
    ` : `
    // Blacklist Logic: Deny if IN list
    const isBlocked = this.restrictedIps.includes(clientIp);
    if (isBlocked) {
       ${action === 'log_only' ? `
       this.logger.warn(\`Detected blacklisted IP: \${clientIp}\`);
       return true;
       ` : `
       this.logger.warn(\`Blocked blacklisted IP: \${clientIp}\`);
       throw new ForbiddenException('Your IP address has been blocked');
       `}
    }
    return true;
    `}
  }
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            guard: guardName,
            config: { type, count: ips.length, action }
        }
    };
};

export const accessListManagerSkillDefinition: SkillDefinition<typeof AccessListManagerSchema> = {
    name: 'access_list_manager',
    description: 'Generates security guards to filter traffic based on IP patterns (Whitelist/Blacklist).',
    parameters: AccessListManagerSchema,
    handler,
};
