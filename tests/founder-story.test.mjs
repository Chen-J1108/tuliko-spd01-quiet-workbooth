import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("founder concept discloses fiction in visible content and preview metadata", async () => {
  const [source, html] = await Promise.all([read("src/BrandNarrativePage.tsx"), read("dist/client/story/index.html")]);
  assert.match(source, /創作ストーリー \/ フィクション/);
  assert.match(source, /実在の創業者や実際の沿革を紹介するものではありません/);
  assert.match(source, /架空の人物・AI生成画像/);
  assert.match(html, /noindex,follow/);
  assert.match(html, /<title>創業ストーリー（フィクション） \| Tuliko<\/title>/);
  assert.doesNotMatch(source, /2002|2019|2026\.08|10万人|Since 2010/);
});

test("five chapters have destinations, active location, accessible menu, and consultation", async () => {
  const source = await read("src/BrandNarrativePage.tsx");
  for (const id of ["founder", "problem", "choices", "birth", "today"]) {
    assert.ok(source.includes(`id: "${id}"`));
    assert.ok(source.includes(`id="${id}"`));
  }
  assert.match(source, /aria-current=\{activeChapter/);
  assert.match(source, /aria-expanded=\{menuOpen\}/);
  assert.match(source, /event.key === "Escape"/);
  assert.match(source, /href="\/#consultation"/);
});

test("story assets are built, bounded in size, and keep clear original-product separation", async () => {
  for (const file of ["founder-morikawa-fiction-v1.webp", "founder-corridor-fiction-v1.webp", "founder-workshop-fiction-v1.webp"]) {
    const bytes = await readFile(new URL(`dist/client/assets/brand-story/${file}`, root));
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    const info = await stat(new URL(`dist/client/assets/brand-story/${file}`, root));
    assert.ok(info.size > 10000 && info.size < 600000, file);
  }
  assert.match(await read("src/BrandNarrativePage.tsx"), /創作ストーリー内の試作品ではありません/);
});

test("story colors match the selected reference and motion can be reduced", async () => {
  const css = await read("src/brand-narrative.css");
  for (const color of ["#080a09", "#edece6", "#101210", "#f1f1ed", "#61625d"]) assert.ok(css.includes(color));
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
});
