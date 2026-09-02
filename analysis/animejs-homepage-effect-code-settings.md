# Anime.js 官网首屏动效核对与 SNAPOD 映射

核对日期：2026-08-10

## 已确认事实

1. 官网 `https://animejs.com/` 的首屏 HTML 只包含标题、说明和操作区；主视觉由运行时插入的 `canvas#renderer` 绘制，不是一个可直接复制的 SVG 圆环组件。
2. 在 1138×834 CSS 像素的官网视口中，`canvas#renderer` 的内部缓冲区为 2276×1668，即 2×像素密度。
3. 官网加载 `/assets/js/scripts.js?v=4.4.1`；该公开脚本包的许可证头显示内部包含 Anime.js 4.5.0，同时包含 `postprocessing` 等渲染代码。
4. Anime.js 官方当前稳定 npm 版本为 4.5.0；5.0.0-beta.1 是测试标签，不应默认用于生产。
5. Anime.js v4 的 SVG 线条绘制使用 `svg.createDrawable()`；错峰动画使用 `stagger()`；动画入口使用具名导出的 `animate()`。

官方资料：

- https://animejs.com/
- https://animejs.com/documentation/svg/createdrawable/
- https://animejs.com/documentation/utilities/stagger/
- https://github.com/juliangarnier/anime

## 无法从公开页面确认的内容

官网未公开一份可读的“首屏圆环参数表”。生产脚本经过打包压缩，并混合自定义 Canvas/3D 渲染逻辑。因此下列数值属于对录屏节奏的工程复现值，不应表述为官网原始参数：外圈角速度、刻度反向角速度、声波呼吸周期和辉光强度。

## 本地 SNAPOD 首屏采用的设置

```js
const heroMotion = {
  edgeLoopMs: 72000,  // 五色轮廓完整巡航一圈
  edgeGap: 0.006,     // 相邻颜色间保留约路径总长 0.6% 的断口
  tickLoopMs: 180000, // 内部刻度反向完整移动一圈
};
```

- 产品保持完全静止，只移动 SVG 的 `strokeDashoffset`。
- 官网圆形外圈被替换为贴合 SPD01 外轮廓的五色路径，颜色顺序为绿、黄、红、青、蓝。
- 红色刻度位于彩色路径内侧，移动方向与外轮廓相反。
- 官网中心图形被替换为正面玻璃范围内的 31 条水平声场线和 25 个点组成的 S 曲线。
- 静音模式降低声场幅度和不透明度；普通模式提高幅度，但不改变产品结构和位置。
- 使用 `prefers-reduced-motion` 时停止循环并保留可读的稳定终态。

## 风险与取舍

- 直接复制官网 Canvas 渲染器会引入大量与产品无关的 3D、后处理和站点代码，增加首屏体积、维护成本与版权风险。
- SVG/DOM 版本没有官网 WebGL 的体积光和复杂材质，但更容易沿产品边缘精确约束，也更容易保证移动端性能和可访问性。
- 当前轮廓基于产品图的可视外形拟合；如果产品图角度、裁切或比例变化，SVG 路径必须同步重新标定。
