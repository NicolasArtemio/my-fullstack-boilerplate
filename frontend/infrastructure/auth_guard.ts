import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const AuthGuardSchema = z.object({
    protectedRoutes: z.record(z.string(), z.array(z.string())).describe('Map of path prefixes to allowed roles. Key is folder/path, Value is array of roles.'),

});

const handler = async (args: z.infer<typeof AuthGuardSchema>): Promise<SkillResult> => {
    const { protectedRoutes } = args;

    // Convert the map to a switch/match logic for middleware
    const routeChecks = Object.entries(protectedRoutes).map(([path, roles]) => {
        return `
    if (req.nextUrl.pathname.startsWith('${path}')) {
      if (!token || !${JSON.stringify(roles)}.includes(token.role as string)) {
         return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }`;
    }).join('\n');

    const middlewareCode = `
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;

    if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

${routeChecks}

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [${Object.keys(protectedRoutes).map(p => `'${p}/:path*'`).join(', ')}],
};
`;

    return {
        success: true,
        data: middlewareCode,
        metadata: {
            securityLevel: 'role-based',
            framework: 'next-auth-v4-middleware'
        }
    };
};

export const authGuardSkillDefinition: SkillDefinition<typeof AuthGuardSchema> = {
    name: 'generate_auth_guard',
    description: 'Generates secure Next.js middleware for role-based route protection.',
    parameters: AuthGuardSchema,
    handler,
};
