import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePaths = [
  "index.html",
  "about/index.html",
  "business/index.html",
  "cases/index.html",
  "news/index.html",
  "contact/index.html",
];

const extract = (source, pattern, label) => {
  const match = source.match(pattern);
  assert.ok(match?.[1], `Missing ${label}`);
  return match[1].trim();
};

test("publishes six indexable core pages with unique metadata", async () => {
  const pages = await Promise.all(pagePaths.map(async (relativePath) => ({
    relativePath,
    source: await readFile(path.join(root, "dist", "client", relativePath), "utf8"),
  })));
  const titles = pages.map(({ source }) => extract(source, /<title>([^<]+)<\/title>/i, "title"));
  const descriptions = pages.map(({ source }) => extract(source, /<meta\s+name="description"\s+content="([^"]+)"/i, "description"));

  assert.equal(new Set(titles).size, pagePaths.length);
  assert.equal(new Set(descriptions).size, pagePaths.length);
  for (const { relativePath, source } of pages) {
    assert.match(source, /<meta\s+name="robots"\s+content="index,follow"/i, `${relativePath} must be indexable`);
  }
});

test("every static content image has meaningful alt text", async () => {
  const contentPages = pagePaths.slice(1);
  for (const relativePath of contentPages) {
    const source = await readFile(path.join(root, "dist", "client", relativePath), "utf8");
    const images = source.match(/<img\b[^>]*>/gi) ?? [];
    assert.ok(images.length > 0, `${relativePath} should contain at least one image`);
    for (const image of images) {
      assert.match(image, /\balt="[^"]+"/i, `${relativePath} has an image without meaningful alt text`);
    }
  }
});

test("all core pages expose a consultation route", async () => {
  const appSource = await readFile(path.join(root, "src", "App.tsx"), "utf8");
  assert.match(appSource, /href="#consultation"/);

  for (const relativePath of pagePaths.slice(1)) {
    const source = await readFile(path.join(root, "dist", "client", relativePath), "utf8");
    assert.match(source, /href="\/#consultation"|href="mailto:/i, `${relativePath} lacks a consultation route`);
  }
});

test("homepage and static pages expose the shared decision path", async () => {
  const [appSource, stylesSource, webglSource] = await Promise.all([
    readFile(path.join(root, "src", "App.tsx"), "utf8"),
    readFile(path.join(root, "src", "styles.css"), "utf8"),
    readFile(path.join(root, "src", "components", "WebGLStage.tsx"), "utf8"),
  ]);
  assert.match(appSource, /function HomeGuideSection/);
  assert.match(appSource, /function HomeFlowSection/);
  assert.ok(
    appSource.indexOf("<HomeGuideSection />") < appSource.indexOf("<ProductSkuSection"),
    "needs guidance should precede the full product lineup",
  );
  assert.ok(
    appSource.indexOf("<ProductSkuSection") < appSource.indexOf("<HomeFlowSection />"),
    "adoption flow should follow product selection",
  );

  for (const relativePath of pagePaths.slice(1)) {
    const source = await readFile(path.join(root, "dist", "client", relativePath), "utf8");
    assert.match(source, /class="site-nav site-nav-desktop"/, relativePath + " lacks the shared navigation");
    assert.match(source, /class="site-footer-main"/, relativePath + " lacks the shared footer");
    assert.match(source, /aria-current="page"/, relativePath + " lacks a current-page marker");
  }

  const newsSource = await readFile(path.join(root, "dist", "client", "news", "index.html"), "utf8");
  assert.match(newsSource, /イベント・更新/);
  assert.match(newsSource, /開催予定/);
  assert.match(stylesSource, /\.app\.is-post-story \.webgl-stage/);
  assert.match(stylesSource, /visibility:\s*hidden/);
  assert.match(webglSource, /postStoryPaused/);
  assert.match(webglSource, /new MutationObserver/);
});

test("fresh homepage loads open with video while TOP remains the product overview", async () => {
  const [entrySource, appSource] = await Promise.all([
    readFile(path.join(root, "src", "main.tsx"), "utf8"),
    readFile(path.join(root, "src", "App.tsx"), "utf8"),
  ]);

  assert.match(entrySource, /window\.location\.hash === "#hero"/);
  assert.match(entrySource, /window\.history\.replaceState/);
  assert.ok(
    appSource.indexOf("<VideoPrelude") < appSource.indexOf('id="hero"'),
    "video prelude must precede the product overview",
  );
  assert.match(appSource, /className="video-prelude-primary" href="#hero">製品を見る<\/a>/);
  assert.match(appSource, /className="brand" href="#hero"/);
});
