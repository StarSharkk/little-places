// The post office's own checks, run by scripts/verify.mjs after the generic ones (an example of the hook).
export default async ({ page, assert, checks, until }) => {
  // the letter travels to the slot and is hidden afterwards, the parcel goes in through the window and a new one returns
  await page.locator('#do-postLetter').click();
  await until(() => { const l = __viewer.model.post.letter; return l.visible && l.position.z < 0.3; }).catch(() => assert(false, 'The letter never reached the slot'));
  await until(() => !__viewer.model.letterRunning);
  assert(await page.evaluate(() => !__viewer.model.post.letter.visible), 'The letter should be gone after posting');
  await page.locator('#do-postParcel').click();
  await until(() => __viewer.model.walls.flapHinge.rotation.x < -1).catch(() => assert(false, 'The parcel window flap never opened'));
  await until(() => !__viewer.model.parcelRunning);
  assert(await page.evaluate(() => { const z = __viewer.model; return z.cart.parcel.visible && Math.abs(z.walls.flapHinge.rotation.x) < 0.01; }), 'Cart and window should reset');
  checks.push('post office: letter slips into the slot and hides; parcel goes in through the opened window; both reset');
};
