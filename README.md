# Little Places · 建筑小集

An interactive Three.js collection featuring **Sakura Café** and **Yamada Grocery**. Both buildings are real 3D models, displayed with an orthographic camera, illustrated outlines and a warm, limited colour palette.

![Building collection](series/screenshots/collection-desktop.png)

## Run the collection

Requires Node.js 20.19+ or 22.12+.

```sh
cd series
npm ci
npm run dev
```

Open http://127.0.0.1:5176/ . Keep all three project directories together: the collection imports the original building modules through Vite aliases.

```sh
npm run build
npm run preview
```

The generated `series/dist` contains the model code and can be served independently.

## Projects

| Directory | Contents |
| --- | --- |
| `series/` | Shared collection interface, overview and individual building views |
| `coffee store/` | Reusable café model, original standalone viewer |
| `grocery/` | Reusable grocery model, texture atlas and original standalone viewer |

The collection supports drag rotation, smooth zoom, five colour presets, labels, turntable, front/side views, café door and menu interactions, and a grocery shutter. The grocery retains its four capsule machines and corrected poster spacing.

## Verification

Production build and local Chrome/Playwright checks passed for desktop (1440 × 1000) and mobile (390 × 844) viewports. Functional checks, screenshots and measured rendering statistics are recorded in [series/VERIFICATION.md](series/VERIFICATION.md) and [series/screenshots/verification.json](series/screenshots/verification.json).

To rerun browser checks, install Chrome, start `npm run preview` in `series`, then run:

```sh
cd series
BASE_URL=http://127.0.0.1:4176/ npm run check
```

Mobile checks use browser viewport emulation; physical mobile devices and M1 frame rates have not been measured.

## Interface inspiration

The collection interface references April Zhu's [Colorfigures](https://april-zhu.com/colorfigures-demo), with an original Little Places identity and layout.
