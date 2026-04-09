import { build } from 'vite';
import config from '../vite.inline.config.mjs';

// Bypass Vite's config-file loader so builds do not walk outside the repo
// looking for parent package metadata in restricted host environments.
await build({
  ...config,
  configFile: false,
});
