# Little Places · 建筑小集

将 Sakura Café、Yamada Grocery 与 Bonjour Bakery 整合为同一套交互式建筑收藏界面。参考 April Zhu [Colorfigures](https://april-zhu.com/colorfigures-demo) 的模型切换、胶囊按钮、色板与留白方式，使用自己的品牌与布局。

## 本地运行

```sh
npm install
npm run dev
```

访问 http://127.0.0.1:5176/ 。生产构建与检查：

```sh
npm run build
npm run preview
# 在另一个终端，对生产构建进行浏览器检查
BASE_URL=http://127.0.0.1:4176/ npm run check
```

检查需要本机 Chrome；截图与检查记录写入 `screenshots/`。

## 操作

- The collection：同时展示三栋建筑；点击模型或名称进入单栋视图。
- Sakura Café：点击门或对应按钮开关门；点击招牌或 Café menu 打开菜单。
- Yamada Grocery：点击卷帘门或对应按钮开关卷帘门。
- Bonjour Bakery：开关门、显隐面包、See-through 查看店内、Take your bread 将纸袋取到门口小桌；再次点击可放回。
- 拖动旋转，滚轮或双指缩放；Default view 恢复默认相机与缩放。
- 五种色板：单栋视图只修改当前建筑；总览修改所有建筑。切换建筑保留各自配色。
- Labels 显示结构注释；Turntable 开始/停止缓慢旋转。直接拖动会停止自动旋转。
- Front / Side 提供正面、侧面视角。标签页支持方向键、Home、End。

## 文件与复用

- `src/collection.js`：模型注册、比例、预设颜色、注释、描边和独立 THREE.Group。
- `src/bakery/`：独立的 Bonjour Bakery 模型；接口见该目录 README。
- `src/main.js`：共享 OrthographicCamera、单 renderer、选择、点击、动画与响应式布局。
- `src/style.css` / `index.html`：收藏界面。
- `scripts/verify.mjs`：Playwright 功能和布局检查。

源码通过 Vite alias 直接复用同级项目：

```
Building/
  coffee store/src/Cafe.js
  grocery/src/Building.js
  grocery/src/optimize.js
  series/
```

两个原项目文件未为此系列重写。开发与重新构建时需要保留上述同级目录；生成的 `dist/` 已包含模型代码，可以独立进行静态托管。Three.js 通过 dedupe 共用同一实例。

增加建筑时，在 `collection.js` 添加模型适配器（Group、配色、可交互结构与注释），再补充标签页及相应交互。动态门、招牌、卷帘门不会与静态几何合并。

## 性能与验证边界

使用静态几何合并、材质复用、DPR 上限 1.5、平面投影和按需渲染。空闲时停止绘制，旋转及开门时恢复。总览在 DPR 1 的 Chrome 检查中记录为 131 draw calls、447,082 triangles、15 textures。该记录不代表 M1 实机帧率；尚未进行 M1 实机性能测试。详细证据见 `VERIFICATION.md`。

面包店专项检查：`BASE_URL=http://127.0.0.1:4176/ node scripts/verify-bakery.mjs`。

## 04 Hanaya Flowers

The flower shop lives in `../flower shop/` and is imported through the `@flowers` alias in `vite.config.js` (keep that folder next to `series/`). Deep link: `#flowers`. Interactions: door, glasshouse vent, *Pick a bouquet*, and *See-through* (shared with the bakery). Browser check: `npm run check:flowers` (writes `screenshots/flowers-verification.json`).

## 05 Sakura Sweets

The corner dessert shop lives in `../coffee store_claude/` (the Sakura Café model with `shop: 'sweets'` signage) and is imported through the `@sweets` alias. It arrives already batched and outlined by its own kit, so the collection skips `finishModel` for it and only keeps its line materials in sync on resize. Deep link `#sweets`; interactions: door and dessert menu (sign, chalkboard or button). Check: `npm run check:sweets`.

Note: the repository's root `.gitignore` excludes `coffee store_claude/`. Un-ignore it before pushing, or a fresh clone of the collection will not build.
