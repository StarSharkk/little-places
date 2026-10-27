# Bonjour Bakery

原创的一层微缩面包店，使用真实 Three.js 几何体、平涂材质、透明玻璃和单张文字图集。默认入口：`http://127.0.0.1:5176/#bakery`。

## 模块

- `Bakery.js`：独立模型入口 `createBakery({ scale, position })`。
- `Architecture.js`：有真实开口的墙体、可移除屋顶、展示橱窗、曲面条纹棚、铰链门。
- `StrawberryCake.js`：圆角分层草莓蛋糕、四颗锥形草莓、八个曲面奶油裱花及圆形贴地底座；屋顶装饰独立建模。
- `Pastries.js`：参数曲面可颂、法棍、吐司、贝果，以及陈列架中的面包。
- `Details.js`：烤箱、收银台、包装盒、纸袋、盆栽、黑板和桌椅。
- `Atlas.js`：一张 2048 × 1024 CanvasTexture 承载招牌、菜单、包装和价签。
- `materials.js`：共享材质与五种配色。
- `primitives.js`：几何体缓存及圆角板、曲线等构造工具。

## 复用

```js
import { createBakery } from './bakery/Bakery.js';
const bakery = createBakery({ scale: 1, position: [0, 0, 0] });
scene.add(bakery.group);
bakery.setPalette(2);
bakery.setSeeThrough(true);
bakery.setPastries(false);
```

模型不创建 renderer 或相机，不接管控制器。门绕 `door.hinge.rotation.y` 转动；纸袋在 `pickupHome` 与 `pickupAway` 之间移动。系列界面负责动画、点击和状态。屋顶、侧墙、门、玻璃、面包和纸袋通过 `dynamic` 列表独立于静态批处理，保留其可见性和运动。

在系列外使用时，可采用 `grocery/src/optimize.js` 的 `finishModel(bakery.group, bakery.dynamic)` 生成屏幕宽度稳定的轮廓线和静态材质批次；窗口调整后更新其返回的线材质 resolution。

See-through 是结构剖开模式：移除屋顶、上部侧墙及窗玻璃，保留门面、低墙、地板和内部家具。Pastries 控制店内展示面包，门外法棍篮及包装袋作为固定道具保留。

所有美术元素均由代码或原创 Canvas 绘制，未嵌入参考截图或下载外部模型。

## 2026-10 视觉统一（与咖啡馆、杂货店同一精度）

- 地面改为作品集统一的图示铺地：`primitives.js` 的 `PavedBase`（铺装面、勒脚、路缘石一圈、伸缩缝），与咖啡馆前庭同一套语言。
- 墙体：石色踢脚线、奶油白护墙板（带凹板）、薄荷绿腰线、淡黄上墙、檐下饰带；四角为带柱础、凹槽和柱头的壁柱；侧墙与后墙有装饰边框。
- 屋顶改为四坡屋顶：檐口分层（薄荷线脚 + 奶油檐板 + 檐口平台），侧面和背面有齿饰；坡面有沿坡向的立边缝线，屋脊和斜脊用更深一档的屋顶色做脊瓦（都随配色变化）。
- 屋脊正中是带百叶的小天窗（通风塔），塔顶有黄铜尖饰和以麦穗为尾的风向标；后坡是烤炉烟囱（随强调色），有砖缝线、奶油色压顶和两只陶烟囱帽。原来后墙外的烟道和屋顶的草莓蛋糕、可颂招牌都已移除。
- 正立面：招牌改为清晰的 BAKERY；橱窗加横档、上亮子分格、奶油色玻璃压条、窗台托架和窗楣；门加分格玻璃、黄铜把手和踢脚板，入口柱上有门牌、营业时间、门铃按钮和小铜铃；遮阳棚加墙面压条、侧挡板和五支铁艺支架。
- 侧立面：木质分格侧窗（窗台、窗楣、拱心石、窗台花盆）、壁灯、手绘面包海报、电表箱、落水管、长椅（坐垫、报纸）。
- 橱窗：三层木质阶梯展架，陈列可颂、甜甜圈、纸杯蛋糕、贝果、吐司、小草莓蛋糕、牛皮纸袋、法棍篮和价签；炉子上方有菜单板。
- 门口：修正后的 A 字黑板（两片在顶部铰接，双脚落地）、门垫、两盆不同高度的绿植、悬挂木招牌；右前方小圆桌配两把木椅（一把拉开）、咖啡和可颂；今日特价立牌、法棍藤篮、面包木箱展架、配送木箱和雨伞架。
- 所有街面物件放在铺地面 y = 0.155（`Details.js` 的 `GROUND`），不再悬空。
- 交互与 API 不变：`door.hinge`、`pickup`、`setPastries`、`setSeeThrough`、`setPalette`、`dynamic`。纸袋的取走位置改到新的小圆桌上。

`scripts/verify-shortcake.mjs` 是早先“只改屋顶蛋糕”任务的检查；蛋糕已移除，这个脚本不再适用。`StrawberryCake.js` 保留在目录中但不再被引用。`npm run check:bakery` 已通过。
