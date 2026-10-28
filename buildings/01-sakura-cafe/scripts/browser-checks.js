async (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForFunction(() => !!window.__cafe);
  const initial = await page.evaluate(() => ({
    orthographic: __cafe.camera.isOrthographicCamera,
    azimuth: (__cafe.controls.getAzimuthalAngle() * 180) / Math.PI,
    elevation: 90 - (__cafe.controls.getPolarAngle() * 180) / Math.PI,
    calls: __cafe.renderer.info.render.calls,
    dpr: __cafe.renderer.getPixelRatio(),
  }));
  assert(
    initial.orthographic && Math.abs(initial.azimuth - 45) < 0.01,
    "Incorrect initial camera",
  );
  assert(
    initial.elevation >= 30 && initial.elevation <= 35,
    "Incorrect elevation",
  );
  const point = async (target) =>
    page.evaluate((target) => {
      const { cafe, camera } = __cafe;
      const group = target === "door" ? cafe.door.leaf : cafe.sign;
      const vector = group.position
        .clone()
        .set(0, target === "door" ? 0.9 : 0, 0.15);
      group.localToWorld(vector);
      vector.project(camera);
      const bounds = document.querySelector("#scene").getBoundingClientRect();
      return {
        x: bounds.x + ((vector.x + 1) * bounds.width) / 2,
        y: bounds.y + ((1 - vector.y) * bounds.height) / 2,
      };
    }, target);
  let p = await point("door");
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(700);
  assert(
    await page.evaluate(
      () => __cafe.doorOpen && __cafe.cafe.door.hinge.rotation.y < -1.7,
    ),
    "Door did not open",
  );
  await page.getByRole("button", { name: "Close the door" }).click();
  p = await point("sign");
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(100);
  assert(await page.locator("#tooltip").isVisible(), "Missing hover feedback");
  await page.mouse.click(p.x, p.y);
  assert(
    await page.locator("#menu").evaluate((el) => el.open),
    "Sign did not open menu",
  );
  await page.keyboard.press("Escape");
  const themes = [];
  for (const [name, hex] of [
    ["Butter yellow", "f6c445"],
    ["Pistachio", "9ad5b6"],
    ["Rose milk", "efa8c4"],
    ["Blue hour", "91b7eb"],
    ["Terracotta", "ef745f"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const actual = await page.evaluate(() =>
      __cafe.cafe.materials.wall.color.getHexString(),
    );
    assert(actual === hex, `Palette mismatch: ${name}`);
    themes.push(name);
  }
  await page
    .getByRole("button", { name: "Butter yellow", exact: true })
    .click();
  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(800);
  assert(
    await page.evaluate(() => __cafe.camera.zoom > 1),
    "Wheel zoom failed",
  );
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.waitForTimeout(100);
  await page.mouse.move(960, 500);
  await page.mouse.down();
  await page.mouse.move(1080, 520, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  assert(
    await page.evaluate(
      () => Math.abs(__cafe.controls.getAzimuthalAngle() - Math.PI / 4) > 0.1,
    ),
    "Rotation failed",
  );
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.waitForTimeout(1100);
  assert(
    await page.evaluate(
      () =>
        Math.abs(__cafe.camera.zoom - 1) < 0.001 &&
        Math.abs(__cafe.controls.getAzimuthalAngle() - Math.PI / 4) < 0.01,
    ),
    "Reset failed",
  );
  await page.mouse.move(300, 90);
  await page.waitForTimeout(700);
  const frame = await page.evaluate(() => __cafe.renderer.info.render.frame);
  await page.waitForTimeout(300);
  const idleFrame = await page.evaluate(
    () => __cafe.renderer.info.render.frame,
  );
  assert(frame === idleFrame, "Idle renderer continues drawing");
  await page.screenshot({ path: "screenshots/desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth === innerWidth,
    ),
    "Mobile horizontal overflow",
  );
  await page.getByRole("button", { name: "Open the door" }).click();
  assert(
    await page.evaluate(() => __cafe.doorOpen),
    "Mobile door button failed",
  );
  await page.getByRole("button", { name: "Close the door" }).click();
  await page.waitForTimeout(700);
  await page.mouse.move(20, 50);
  await page.screenshot({ path: "screenshots/mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert(errors.length === 0, errors.join("\n"));
  return {
    passed: true,
    initial,
    themes,
    checks: [
      "door raycast",
      "sign raycast",
      "hover",
      "five palettes",
      "wheel zoom",
      "drag rotate",
      "reset",
      "idle rendering",
      "mobile overflow",
      "mobile door button",
    ],
    consoleErrors: errors,
  };
}
