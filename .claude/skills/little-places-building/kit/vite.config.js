import { defineConfig } from 'vite';
// top-level await in the viewer needs an es2022 target
export default defineConfig({ build: { target: 'es2022' }, resolve: { dedupe: ['three'] } });
