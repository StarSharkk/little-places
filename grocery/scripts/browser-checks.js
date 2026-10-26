export default async (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:5174/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.__grocery);
  await page.waitForTimeout(400);
  const initial = await page.evaluate(() => ({
    orthographic: __grocery.camera.isOrthographicCamera,
    azimuth: (__grocery.controls.getAzimuthalAngle() * 180) / Math.PI,
    elevation: 90 - (__grocery.controls.getPolarAngle() * 180) / Math.PI,
    calls: __grocery.renderer.info.render.calls,
    triangles: __grocery.renderer.info.render.triangles,
    textures: __grocery.renderer.info.memory.textures,
    atlasRegions: __grocery.building.atlas.regions.size,
  }));
  assert(
    initial.orthographic && Math.abs(initial.azimuth - 45) < 0.001,
    "Initial camera is not orthographic at 45 degrees",
  );
  assert(
    initial.elevation > 30 && initial.elevation < 35,
    "Incorrect elevation",
  );
  const layout=await page.evaluate(()=>__grocery.building.layoutAudit);
  assert(layout.capsuleMachineCount===4,'Expected four capsule toy machines');
  assert(layout.posterCount===5 && layout.posterStockIntersections===0,'Posters intersect the shelf or stock');
  assert(layout.minimumPosterClearance>.02 && layout.posterWallClearance>.005,'Insufficient clearance around posters');
  const point = await page.evaluate(() => {
    const g = __grocery.building.storefront.shutter;
    const p = g.position.clone().set(0, 0.5, 0.05);
    g.localToWorld(p);
    p.project(__grocery.camera);
    const r = document.querySelector("#scene").getBoundingClientRect();
    return {
      x: r.x + ((p.x + 1) * r.width) / 2,
      y: r.y + ((1 - p.y) * r.height) / 2,
    };
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(800);
  assert(
    await page.evaluate(
      () =>
        __grocery.shopOpen &&
        __grocery.building.storefront.shutter.scale.y < 0.1,
    ),
    "Shutter raycast or animation failed",
  );
  await page.getByRole("button", { name: "Close the shop" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Details", exact: false }).click();
  assert(
    (await page.locator("#annotations").getAttribute("aria-hidden")) ===
      "false",
    "Annotations failed",
  );
  await page.getByRole("button", { name: "Details", exact: false }).click();
  const themes = [];
  for (const [name, wall, accent] of [
    ['Butter yellow','f6c445','ef745f'],
    ['Pistachio','9ad5b6','ef745f'],
    ['Rose milk','efa8c4','ef745f'],
    ['Blue hour','91b7eb','f6c445'],
    ['Terracotta','ef745f','9ad5b6'],
  ]) {
    await page.getByRole('button',{name,exact:true}).click();
    const colours = await page.evaluate(() => {
      const rgba=__grocery.building.atlas.context.getImageData(1100,30,1,1).data;
      return {wall:__grocery.building.materials.wall.color.getHexString(),
        printedAwning:[...rgba].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')};
    });
    assert(colours.wall===wall && colours.printedAwning===accent, `Geometry and atlas theme mismatch: ${name}`);
    themes.push(name);
  }
  await page.getByRole('button',{name:'Butter yellow',exact:true}).click();
  await page.getByRole("button", { name: "Street front", exact: true }).click();
  assert(
    await page.evaluate(() => Math.abs(__grocery.camera.position.x) < 0.01),
    "Front view failed",
  );
  await page
    .getByRole("button", { name: "Gacha corner", exact: true })
    .click();
  assert(
    await page.evaluate(() => Math.abs(__grocery.camera.position.z) < 0.01),
    "Side view failed",
  );
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.mouse.move(950, 550);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(700);
  assert(
    await page.evaluate(() => __grocery.camera.zoom > 1.05),
    "Wheel zoom failed",
  );
  await page.mouse.down();
  await page.mouse.move(1070, 560, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  assert(
    await page.evaluate(
      () =>
        Math.abs(__grocery.controls.getAzimuthalAngle() - Math.PI / 4) > 0.1,
    ),
    "Drag rotation failed",
  );
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.mouse.move(300, 70);
  await page.waitForTimeout(900);
  assert(
    await page.evaluate(
      () =>
        Math.abs(__grocery.camera.zoom - 1) < 0.001 &&
        Math.abs(__grocery.controls.getAzimuthalAngle() - Math.PI / 4) < 0.001,
    ),
    "Reset did not restore initial camera",
  );
  const frame = await page.evaluate(() => __grocery.renders);
  await page.waitForTimeout(300);
  assert(
    frame === (await page.evaluate(() => __grocery.renders)),
    "Idle renderer keeps redrawing",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  assert(
    await page.evaluate(
      () => innerWidth === document.documentElement.scrollWidth,
    ),
    "Mobile overflows horizontally",
  );
  await page.getByRole("button", { name: "Open the shop" }).click();
  assert(
    await page.evaluate(() => __grocery.shopOpen),
    "Mobile shutter button failed",
  );
  await page.getByRole("button", { name: "Close the shop" }).click();
  await page.waitForTimeout(800);
  assert(errors.length === 0, errors.join("\n"));
  return {
    passed: true,
    initial,
    layout,
    themes,
    consoleErrors: errors,
    checks: [
      "orthographic framing",
      "four capsule machines",
      "poster-stock collision clearance",
      "shutter raycast and animation",
      "annotations",
      "five synchronised geometry and atlas palettes",
      "front and side views",
      "wheel zoom",
      "drag rotation",
      "reset",
      "render-on-demand",
      "mobile layout",
      "mobile shutter button",
    ],
  };
}
