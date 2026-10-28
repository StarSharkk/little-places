# SAKURA CAFÉ

真实 Three.js 交互式欧式街角咖啡馆。Vite + JavaScript ES modules，无 React 依赖。初始空目录中新建，没有修改其他项目。

## 本地运行

```sh
npm install
npm run dev -- --port 5173
```

打开 http://127.0.0.1:5173/ 。`npm run build` 生成 `dist/`，`npm run preview` 预览生产构建。

## 操作

- 拖动旋转；滚轮平滑缩放；移动端单指旋转、双指缩放。
- 点击薄荷色门板开关门；点击 SAKURA CAFÉ 招牌查看菜单。
- 底部五个色块切换整栋建筑配色；Reset view 恢复默认镜头。
- 门、菜单和缩放也有可通过键盘使用的按钮。菜单支持 Escape 关闭及原生 dialog 焦点管理。

## 可复用结构

- `src/Cafe.js`：`createCafe(options)` 返回独立 THREE.Group、门铰链、招牌、材质及换色函数。
- `src/components/architecture.js`：Roof、Window、Door、Awning、Sign。
- `src/components/Decoration.js`：花盆、花箱、壁灯、桌椅、杯碟、黑板、樱花、屋面和街道细节。
- `src/components/primitives.js`：共享几何、曲线、拱形和挤出形状、文字贴图。
- `src/components/finish.js`：静态材质批处理、屏幕空间描边、插画投影。
- `src/config.js`：尺寸、门窗位置、装饰密度和五套配色。
- `src/main.js`：预览场景及 DOM 交互，模型不依赖本页面 UI。

```js
import { createCafe } from './src/Cafe.js';
import { finishModel } from './src/components/finish.js';

const cafe = createCafe({ decorationDensity: 0.6 });
// 编辑部件应在 finishModel 合并静态网格之前进行。
const lineMaterials = finishModel(cafe.group, [cafe.door.leaf, cafe.sign]);
cafe.group.position.set(10, 0, 4);
streetScene.add(cafe.group);
cafe.setPalette(2);
// 在宿主 resize 时更新描边的像素分辨率。
lineMaterials.forEach(material => material.resolution.set(width, height));
// 宿主的 raycaster 沿父级查找 userData.action，值为 door / menu。
// 转动门：cafe.door.hinge.rotation.y = -Math.PI * 0.58;
```

`width/depth/height/roofRise` 控制主体比例；门窗数组是局部坐标，改变大幅尺寸时需一起调整。`decorationDensity: 0` 去掉街边家具和盆栽，`0.6` 保留主桌椅，`1` 含侧边座位。每件装饰位置在 Decoration.js 中明确编排，不使用随机散布。

## 美术与性能

正交相机水平 45°、俯视约 32.47°。主要使用 MeshToonMaterial 与 MeshBasicMaterial，三阶明暗、EdgesGeometry + LineSegments2 描边，内部约 1.05px，主要立柱约 1.4px。拱形、雨篷、山墙和屋顶使用 Shape/ExtrudeGeometry，家具用曲线和管状几何。玻璃门为半透明材质，开门后可见小型室内柜台。

静态网格按材质合并；门和招牌独立批处理。DPR 上限 1.5，不使用后处理、环境贴图或实时阴影。地面阴影是从真实模型几何投射生成的静态平面剪影，保证清晰边界和低成本；开门时不重新计算投影。静止时不重复提交渲染，交互时恢复。

菜单内容为演示数据。字体使用 Google Fonts，网络不可用时自动回退本地 Georgia / sans-serif。没有通过图片替代建筑模型。

## 验证

实际浏览器检查脚本：`scripts/browser-checks.js`（可通过 Playwright MCP 的 browser_run_code_unsafe filename 参数运行）。运行前启动本地 5173 服务。记录见 `VERIFICATION.md`。

截图：`screenshots/desktop.png`、`screenshots/mobile.png`。阶段二和三截图仅作为过程记录，最终效果以 desktop.png 为准。
