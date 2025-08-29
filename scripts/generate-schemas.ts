import fs from 'fs';
import path from 'path';
import { loadPlugins } from '../server/plugin-loader';

async function main() {
  const plugins = await loadPlugins();
  const openapi: any = {
    openapi: '3.0.0',
    info: { title: 'Circadian Hue Plugin API', version: '1.0.0' },
    paths: {}
  };

  for (const plugin of plugins) {
    openapi.paths[`/plugins/${plugin.name}`] = {
      get: {
        summary: `Invoke ${plugin.name} plugin`,
        responses: {
          '200': { description: 'OK' }
        }
      }
    };
  }

  const docsDir = path.join(process.cwd(), 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'openapi.json'), JSON.stringify(openapi, null, 2) + '\n');

  const graphql = [
    'type Query {',
    ...plugins.map(p => `  ${p.name.replace(/[^a-zA-Z0-9_]/g, '_')}: String`),
    '}'
  ].join('\n');
  fs.writeFileSync(path.join(docsDir, 'schema.graphql'), graphql + '\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
