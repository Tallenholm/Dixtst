import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export type PluginType = 'effects' | 'sensors' | 'health' | 'adapter';

export interface Plugin {
  name: string;
  type: PluginType;
  init?(): void | Promise<void>;
}

export async function loadPlugins(dir = path.join(process.cwd(), 'plugins')): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  if (!fs.existsSync(dir)) return plugins;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const mod = await import(pathToFileURL(fullPath).href);
    const plugin: Plugin = mod.default || mod;
    if (plugin && plugin.name && plugin.type) {
      if (typeof plugin.init === 'function') {
        await plugin.init();
      }
      plugins.push(plugin);
    }
  }
  return plugins;
}
