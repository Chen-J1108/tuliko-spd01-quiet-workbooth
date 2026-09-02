# Design QA — SPD01 exact front reference

- Source visual truth: `D:\桌面\new project\杭州嘉兴静音仓SNAPOD\杭州嘉兴静音仓SNAPOD\11、SNAPOD 单体图\01 单人舱 直台面配置\SPD01-灰绿-v2-正.png`
- Source pixels: 2368 × 2999.
- Implementation screenshot: `D:\New project 2\tuliko-dark-optimized-v1\qa-hero-front-1440-final.png`
- Implementation pixels / CSS viewport: 1440 × 900 at devicePixelRatio 1.
- State: desktop `#hero`, authoritative GLB loaded, exact front elevation.
- Normalized comparison: `D:\New project 2\tuliko-dark-optimized-v1\qa-front-reference-comparison.png`, 1440 × 900. The source is fitted into a 720 × 900 white panel; the live product region is cropped from the matching 1440 × 900 hero and fitted into a 720 × 900 dark panel without changing aspect ratio.

## Full-view comparison evidence

The live product now preserves the reference's defining front relationship: desk on the viewer's left, handle on the right, square-on uprights, black top/base/frame, grey-green exterior, neutral inner surface, pale desk, dark carpet/base and a restrained warm ceiling strip. The neutral liner stays inside the shell and improves dark-background separation without producing an exterior rectangle or glow. The existing editorial copy, wave field and global rail remain in their approved positions.

The supplied reference includes a stool that is not present in the preserved authoritative GLB source. This is an expected geometry-scope difference under the project requirement to retain the authoritative GLB rather than fabricate or replace its parts. The reference's white studio background is likewise intentionally translated to the existing dark Tuliko product theatre.

## Focused-region comparison evidence

The normalized side-by-side comparison was inspected at the product crop. The high-value orientation cues, shell/frame proportions and material color relationships match. The implementation remains crisp at its live scale; glass and dark hardware retain separation from the page. Additional responsive captures confirm the same complete product silhouette at 768 × 900 and 390 × 844.

## Required fidelity surfaces

- Fonts and typography: the selected source contains no UI typography. Existing Tuliko Japanese typography and copy were intentionally preserved and remain readable without product overlap.
- Spacing and layout rhythm: the desktop product retains its approved right-shifted hero field; copy, product annotations and the global rail remain clear. The product is fully visible at 1440, 768 and 390 widths.
- Colors and visual tokens: sage shell, near-black structure, neutral felt/glass, pale desk, dark floor and warm strip preserve the source hierarchy while respecting the existing dark-site palette.
- Image quality and asset fidelity: the implementation uses the authoritative local GLB, not a drawn substitute. The source's front orientation and material relationships are reproduced; the missing stool is an explicit authoritative-geometry constraint.
- Copy and content: existing verified Japanese copy is unchanged. No text from the reference image was invented or added.

## Comparison history

1. Initial evidence: `qa-hero-before-front-correction.png` showed the inverse face—desk right and handle left. This was a P1 orientation mismatch.
2. Fix: changed the authoritative front yaw from `Math.PI * 0.5` to `-Math.PI * 0.5`; `qa-hero-after-front-turn.png` confirmed desk left / handle right.
3. Responsive/material fix: kept the compact neutral inner liner visible from the first hero frame. `qa-hero-front-768-liner.png` and `qa-hero-front-390.png` confirmed the glass, frame and handle remain readable without crop or overflow.
4. Structural-label follow-up: the yaw change exposed stale label-side assignments. Desk/acoustic-panel labels were moved to the left, column/side-panel labels to the right, and line lanes were separated within their projected component bounds. `qa-structure-label-sides-final-2.png` and `qa-structure-label-sides-late.png` confirm short, non-crossing leaders that do not cover the product.
5. Final desktop evidence: `qa-hero-front-1440-final.png` and `qa-front-reference-comparison.png` show the corrected product state. No actionable P0/P1/P2 visual mismatches remain within the authoritative-GLB scope.

## Verification

- Build: passed (`tsc --noEmit`, Vite production build, Sites output preparation).
- Browser: 1440 × 900, 768 × 900 and 390 × 844 checked; no horizontal overflow or product clipping.
- Anchors: `#hero`, `#structure`, `#acoustic`, `#modular` and `#interaction` reloaded and inspected with the corrected front baseline.
- Structure: front-labelled explosion, full exploded inspection and late callout cues inspected; labels follow the flipped component projections and do not create through-product crossing lines.
- Console: zero browser errors in the final 1440 × 900 hero state.
- Loading/fallback: authoritative GLB reached `is-loaded`; existing raster fallback remains available for model-load failure.

## Follow-up polish

- P3: if a future verified authoritative model includes the reference stool, it can be added as a semantic module and included in the explosion system. It was intentionally not approximated in this pass.

final result: passed
