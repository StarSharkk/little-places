import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const relative = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
 resolve:{dedupe:['three'],alias:{'@sakura':relative('../coffee store/src/Cafe.js'),'@yamada':relative('../grocery/src/Building.js'),'@grocery-finish':relative('../grocery/src/optimize.js'),'@flowers':relative('../flower shop/src/shop/FlowerShop.js'),'@sweets':relative('../coffee store_claude/src/cafe/CafeBuilding.js')}},
 server:{fs:{allow:[relative('..')]}},
 build:{rollupOptions:{output:{manualChunks(id){if(id.includes('three.core.js'))return 'three-core';if(id.includes('/three/build/'))return 'three-renderer';if(id.includes('/three/examples/'))return 'three-addons';}}}},
});
