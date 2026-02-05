import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const SitemapGeneratorSchema = z.object({
    baseUrl: z.string().url().describe('The base URL of the website, e.g., https://mysite.com'),
    dynamicRoutes: z.array(z.string()).describe('List of dynamic route prefixes to include, e.g., ["/blog", "/products"]'),
});

const handler = async (args: z.infer<typeof SitemapGeneratorSchema>): Promise<SkillResult> => {
    const { baseUrl, dynamicRoutes } = args;

    const sitemapCode = `import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = '${baseUrl.replace(/\/$/, '')}';

  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    // Add more static routes here
  ].map((route) => ({
    url: \`\${baseUrl}\${route}\`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic routes placeholder - in a real app, you might fetch ids from a DB
  // This demonstrates how to structure the logic
  const dynamicEntries = ${JSON.stringify(dynamicRoutes)}.flatMap(prefix => {
     // Example: return fetch(\`\${baseUrl}/api\${prefix}\`).then(res => res.json())...
     // For now, we return a generic entry
     return [
       {
         url: \`\${baseUrl}\${prefix}\`,
         lastModified: new Date(),
         changeFrequency: 'weekly' as const,
         priority: 0.5,
       }
     ];
  });

  return [...routes, ...dynamicEntries];
}
`;

    const robotsCode = `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = '${baseUrl.replace(/\/$/, '')}';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/'],
    },
    sitemap: \`\${baseUrl}/sitemap.xml\`,
  };
}
`;

    return {
        success: true,
        data: {
            'app/sitemap.ts': sitemapCode,
            'app/robots.ts': robotsCode
        },
        metadata: {
            baseUrl,
            sitemapType: 'dynamic'
        }
    };
};

export const sitemapGeneratorSkillDefinition: SkillDefinition<typeof SitemapGeneratorSchema> = {
    name: 'sitemap_generator',
    description: 'Generates dynamic sitemap.ts and robots.ts files for SEO.',
    parameters: SitemapGeneratorSchema,
    handler,
};
