# MACHI · 山田雑貨店

三层日式街角杂货铺，采用 Sakura Café 同系列的奶油白、糖果色、深色描边和平面蓝色投影。使用真实 Three.js 3D 结构与原创 CanvasTexture 图集；日文招牌、广告、商品和标识通过纹理呈现。

## 运行

```sh
npm install
npm run dev
```

打开 http://127.0.0.1:5174/ 。`npm run build` 生成生产文件到 `dist/`。

## 操作

- 拖动旋转；滚轮平滑缩放；移动端单指旋转、双指缩放。
- 点击可见的卷帘下部，或使用 Open the shop 按钮开店。Close the shop 关闭卷帘。
- 五个色块同时更新建筑材质与招牌、海报、售货机图集。
- Isometric / Street front / Gacha corner 切换视角，右下角 ↺ 恢复默认镜头。
- Details 显示建筑部位标注。

默认是正交相机、水平 45°、俯视约 32.5°。手机采用标题、模型、操作区分开的布局。

## 文件与组件

- `src/Building.js`：`createBuilding(options)`，返回独立 THREE.Group、材质、图集、卷帘控制器和 `setTheme(index)`。
- `src/themes.js`：咖啡馆同系列的五套色彩，以及印刷贴图的颜色映射。
- `src/TextureAtlas.js`：单张 2048 × 2048 原创图集、28 个区域、可复用的 `plane()` / `attach()` 接口。
- `src/components/Storefront.js`：店招、斜面雨棚、卷帘、开口与内凹货架。
- `src/components/CapsuleMachine.js`：两列两层的四台扭蛋机，含透明罩、真实胶囊、硬币口、旋钮和取物口。
- `src/components/Merchandise.js`：包装食品、杯子、文具和水果陈列。
- `src/components/VendingMachine.js`：有厚度的机身、出货口、付款区、脚座和商品贴图。
- `src/components/RooftopEquipment.js`：设备机房、双层空调支架、栏杆、风管及天线。
- `src/components/StreetProps.js`：独立展示底座、水果箱、盆栽、回收箱、交通锥、电杆与架空线。
- `src/components/FacadeDetails.js`：沿墙电缆、接线盒、海报夹扣和立体店内柜台。
- `src/optimize.js`：静态网格合并、屏幕像素描边和平面投影。
- `src/main.js`：预览场景与页面交互。

## 整合到街区

```js
import { createBuilding } from './src/Building.js';
import { finishModel } from './src/optimize.js';

// furniture:false 省略当前展示底座及街边道具，供宿主街区提供道路。
const store = createBuilding({ furniture: false });
const outlines = finishModel(store.group, [store.storefront.shutter]);
store.group.position.set(8, 0, 4);
streetScene.add(store.group);
store.setTheme(0);

// 在宿主 resize 时保持描边像素宽度。
outlines.forEach(material => material.resolution.set(width, height));
// 宿主动画中将 amount 从 0 平滑过渡到 1 即可开店。
store.storefront.setOpen(amount);
```

`src/materials.js` 的 config 管理主体宽、深、高及楼层位置。门窗与道具属于明确编排的样板，较大比例改动时需要同步调整局部位置。编辑单独部件应在 `finishModel()` 合并静态网格前进行。

## 性能

共享几何与材质，静态部件按材质合并，卷帘保留独立批次。DPR 上限 1.5，静止时停止重复提交渲染，不使用后处理或实时阴影。蓝色阴影由真实模型生成平面剪影，开店时不重新计算。

图集使用约 21.3 MiB GPU 内存（含 mipmaps），另外一张为 3 × 1 明暗阶梯纹理。字体优先系统日文字体；页面英文使用 Google Fonts，离线时回退系统字体。

## 验证

本地开发服务运行后，执行：

```sh
npm run check
```

使用已安装的 Google Chrome 与 Playwright 验证相机、卷帘点击和动画、五套几何/贴图同步换色、标注、旋转、缩放、重置、静止渲染和手机布局。结果写入 `screenshots/verification.json`，同时导出桌面、手机、开店、扭蛋机侧面及纹理图集截图。另可执行 `node scripts/capture-details.mjs` 导出内部、海报和扭蛋机放大图。

详细验证结论见 `VERIFICATION.md`。浏览器检查不能替代 M1 8GB 设备的实际性能测试。
