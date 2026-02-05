import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const AuthSessionManagerSchema = z.object({
    storeName: z.string().default('useAuthStore').describe('Name of the Zustand store hook'),
    loginPath: z.string().default('/login').describe('Path to redirect after logout'),
    axiosInstancePath: z.string().optional().describe('Import path for the axios instance (e.g., @/lib/axios) to clear headers'),
    userTypeImport: z.string().optional().describe('Import path for the User type (e.g., @/types/user)'),
});

const handler = async (args: z.infer<typeof AuthSessionManagerSchema>): Promise<SkillResult> => {
    const { storeName, loginPath, axiosInstancePath, userTypeImport } = args;

    const axiosImport = axiosInstancePath ? `import api from '${axiosInstancePath}';` : '';
    const userType = userTypeImport ? `import { User } from '${userTypeImport}';` : 'type User = any;';

    const code = `
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
${userType}
${axiosImport}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const ${storeName} = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Set Axios Header
        ${axiosInstancePath ? `api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;` : '// NOTE: Remember to set your axios default authorization header here'}
      },

      logout: () => {
        // "Clean Slate" Strategy
        
        // 1. Clear Internal State
        set({ user: null, token: null, isAuthenticated: false });

        // 2. Clear Storage (Aggressive)
        // This ensures no stale keys (like 'auth-storage' or others) remain.
        localStorage.clear(); 

        // 3. Clear Axios Headers (Prevent stale token usage)
        ${axiosInstancePath ? `delete api.defaults.headers.common['Authorization'];` : '// NOTE: Remember to clear your axios default authorization header here'}

        // 4. Force Redirect
        // Using window.location.href ensures a full page refresh, clearing any in-memory react state variables.
        window.location.href = '${loginPath}';
      }
    }),
    {
      name: 'auth-storage', // key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
`;

    return {
        success: true,
        data: code.trim(),
        metadata: {
            description: "Robust Auth Store with Clean Slate Logout Strategy",
            technologies: ["zustand", "localstorage"],
            strategy: "clean-slate"
        }
    };
};

export const authSessionManagerSkillDefinition: SkillDefinition<typeof AuthSessionManagerSchema> = {
    name: 'generate_auth_session_manager',
    description: 'Generates a robust Zustand Auth Store implementing the "Clean Slate" logout strategy (localStorage.clear, state reset, axios cleanup, and forced redirect).',
    parameters: AuthSessionManagerSchema,
    handler,
};
