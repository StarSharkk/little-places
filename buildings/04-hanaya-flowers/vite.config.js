import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const relative = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  // The series' shared outline/shadow finishing is reused as-is so this building renders identically in the collection.
  resolve: { dedupe: ['three'], alias: { '@grocery-finish': relative('../02-yamada-grocery/src/optimize.js') } },
  server: { fs: { allow: [relative('..')] } },
});
