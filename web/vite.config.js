import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const relative = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
 resolve:{dedupe:['three'],alias:{'@sakura':relative('../buildings/01-sakura-cafe/src/Cafe.js'),'@yamada':relative('../buildings/02-yamada-grocery/src/Building.js'),'@grocery-finish':relative('../buildings/02-yamada-grocery/src/optimize.js'),'@bakery':relative('../buildings/03-bonjour-bakery/Bakery.js'),'@flowers':relative('../buildings/04-hanaya-flowers/src/shop/FlowerShop.js'),'@sweets':relative('../buildings/05-sakura-sweets/src/cafe/CafeBuilding.js'),'@books':relative('../buildings/06-little-bookshop/Bookstore.js'),'@pizza':relative('../buildings/07-pizza-piccola/Pizzeria.js')}},
 server:{fs:{allow:[relative('..')]}},
 build:{rollupOptions:{output:{manualChunks(id){if(id.includes('three.core.js'))return 'three-core';if(id.includes('/three/build/'))return 'three-renderer';if(id.includes('/three/examples/'))return 'three-addons';}}}},
});
