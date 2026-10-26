# Little Places · 建筑小集

将 Sakura Café 与 Yamada Grocery 整合为同一套交互式建筑收藏界面。参考 April Zhu [Colorfigures](https://april-zhu.com/colorfigures-demo) 的模型切换、胶囊按钮、色板与留白方式，使用自己的品牌与布局。

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

- The collection：同时展示两栋建筑；点击模型或名称进入单栋视图。
- Sakura Café：点击门或对应按钮开关门；点击招牌或 Café menu 打开菜单。
- Yamada Grocery：点击卷帘门或对应按钮开关卷帘门。
- 拖动旋转，滚轮或双指缩放；Default view 恢复默认相机与缩放。
- 五种色板：单栋视图只修改当前建筑；总览修改两栋。切换建筑保留各自配色。
- Labels 显示结构注释；Turntable 开始/停止缓慢旋转。直接拖动会停止自动旋转。
- Front / Side 提供正面、侧面视角。标签页支持方向键、Home、End。

## 文件与复用

- `src/collection.js`：模型注册、比例、预设颜色、注释、描边和独立 THREE.Group。
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

使用静态几何合并、材质复用、DPR 上限 1.5、平面投影和按需渲染。空闲时停止绘制，旋转及开门时恢复。总览在 DPR 1 的 Chrome 检查中记录为 72 draw calls、257,276 triangles、13 textures。该记录不代表 M1 实机帧率；尚未进行 M1 实机性能测试。详细证据见 `VERIFICATION.md`。
