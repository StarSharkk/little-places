# 10 / Sakura Tram Station

独立 Three.js 场景，入口 `http://127.0.0.1:5176/#tram`。副标题：A quiet stop in a charming town.

遵循 `.claude/skills/little-places-building/SKILL.md`：人尺度、正交展示、统一 Toon 材质和屏幕像素描边、原创图集、白色铺地、蓝色投影。不创建 renderer、相机、灯光或自己的动画循环。

## 模块

- `TramStation.js`：`TramStationRoot`、交互联锁、deltaTime 进出站、出票、配色和昼夜 API。
- `Station.js`：站房、真实门窗开口、阁楼山墙、钟、绿色雨棚、候车厅与站台。
- `Track.js`：双轨、轨枕、碎石、接触线、绝缘子、道口信号和护栏。
- `Tram.js`：`TramMotionRoot`、绿白车体、圆角车头、独立滑门、转动轮轴、座椅、扶手、受电弓。
- `Props.js`：售票机、可按动按钮、出票纸张、红色饮料机、垃圾箱、樱花树、自行车、路灯、花盆、站牌。
- `Atlas.js`：2048 × 1536 原创 Canvas 图集；站名、时刻表、地图、商品、票面、路线牌和海报共用一张贴图。
- `materials.js`：Classic Vintage Green 初始配色与五套建筑配色；五套主题同时协调站房、雨棚、电车双色和珊瑚色饰条；植物、玻璃、轮轨和木料保持固有色。

## 坐标与运动

底座 13 × 9.6，候车区加深 1.5 units，站台前缘 z=2.15，轨道轴线 z=3.7。站台顶 y=0.66，轨顶 y=0.34，轨距 1.18，接触线 y=5.65。轮半径 0.245，轮轴中心 y=0.585。

`TramLoop.js` 管理单向自动循环。入口 x=-9.35、出口 x=9.35、站台停靠 x=-0.45，巡航速度 1.85 units/s。车辆连同随行投影使用两张随根节点变换的裁切平面，显示范围为 x∈[-6.35,6.35]，因此不需要延长底座；车尾完全驶出后才隐藏并重置到入口。重置位移不会计入车轮转动。

加载后自动运行。点击开门会请求站台停靠；若已驶过站台则保持方向，在下一轮进站时平滑减速，完全停稳后再开门。关门动画完成后重新加速。暂停/继续按钮控制自动运行；开门期间不能发车。页面隐藏、场景不在当前展示页时，由网页统一暂停推进。减少动态效果设置下保持停靠姿态。

导出 `footprint` 固定底座范围，Collection 以底座计算旋转中心和相邻间距，虚拟路径不会改变整个场景的 Pivot。

电车的刚体、两组双侧滑门、两个轮轴分别通过共享 `finishModel` 预合批，之后以 `userData.live` 保留整个局部层级，避免 Collection 再次合并动态节点。所有对象同属 `TramStationRoot` 并共享 Collection 的底座中心旋转。

## API

`createTramStation(options)` 返回 `group`, `materials`, `atlas`, `state`, `tram`, `station`, `props`, `dynamic`, `outlineMaterials`, `shadowFloor`, `labels`。

- `toggleTravel(instant=false)`：暂停 / 继续自动运行，开门期间拒绝发车。
- `toggleDoors(instant=false)`：请求停站开门 / 取消请求 / 关门后恢复运行。
- `buyTicket(instant=false)`：屏幕亮起、按钮按动、车票弹出，序列可重复。
- `animate(dt)`：推进活动序列；返回是否需要下一帧。
- `settle()`：减少动态效果设置变更时立即完成运动。
- `setNight(amount)`：复用网页昼夜系统，改变玻璃、吊灯、车灯、信号与屏幕颜色。
- `setSeeThrough(on)`：移除站房正面、站房屋顶/雨棚与电车车顶，保留室内后墙。
- `setPalette(index)`：同时改变站房、屋顶、门窗框、雨棚、售票机、电车双色及饰条。

## 验证

在 `web/` 下运行 `npm run check:tram`；截图与结果在 `web/screenshots/tram-*`。脚本检查十场景注册、多角度、模型点击和按钮、门车联锁、行驶边界/轮轨接触/轮距比、出票重复、固定电车配色、昼夜、透视、旋转、缩放、手机、减少动态效果、空闲停绘和控制台。

未进行真实手机或 M1 硬件帧率测试。
