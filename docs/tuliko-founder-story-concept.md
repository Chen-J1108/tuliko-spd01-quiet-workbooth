# Tuliko 创始人故事重排 · 2026-09-07

## 参考与范围

- 叙事参考：[Kagushop 创始人故事](https://www.kagushop.com/pages/transform-all-spaces-into-a-more-efficient-way-of-operation#ks-founder-main)。读取其正文并检查桌面版式；只借鉴人物起点、分章经历、价值观到产品的组织方式，不使用其人物、照片、2010/2015 年份或用户数字。
- 配色参考：[用户指定的 4175 页面](http://127.0.0.1:4175/#top)。读取实际浏览器计算样式：故事舞台 #080a09，正文区 #edece6，浅底文字 #101210，深底文字 #f1f1ed，浅底说明 #61625d。
- 修改目标：4174 的 /story/，不是 4175 工程。首页模型、公司事实页、配置页和共享配色不改；未部署线上网站。
- 创始人“森川直人 / Naoto Morikawa”、身份、经历、对白与命名桥段均为用户授权的虚构创作，不可脱离页面中的虚构标注当作真实品牌资料使用。

## 页面逻辑

1. 原点：人物大幅肖像 + 森川是谁 + 品牌主张 + 首屏虚构声明。
2. 触发：廊道电话场景 + 具体对白 + 问题从家具转向独处空间。
3. 取舍：同一人物的试作场景 + 围合感、动线、预算三项困难与选择。
4. 诞生：Tuliko 命名的创作桥段 + 与现有 SPD01 产品图明确区分 + 非历史年表的阶段路径。
5. 今天：倾听使用者、说明条件、关注日常体验，接到产品 / 配置 / 咨询入口。

保留日文页面语言。桌面交错双栏，手机单栏；单一固定章节导航支持真实锚点、当前位置、键盘与减少动态偏好。页面 metadata 与 noscript 同样说明虚构，设置 noindex。

## 生成图片

采用内置 imagegen，不使用 CLI/API 后备路径。三张图均为 1536 × 1024 的创作情景。由生成 PNG 转码为网页 WebP，未修改原始文件。人物第二场景使用第一张的身份参考。

- [人物肖像](../public/assets/brand-story/founder-morikawa-fiction-v1.webp)
- [走廊通话](../public/assets/brand-story/founder-corridor-fiction-v1.webp)
- [试作场景](../public/assets/brand-story/founder-workshop-fiction-v1.webp)

### 最终提示词：人物肖像

Use case: photorealistic-natural. Asset type: editorial portrait for Tuliko fictional founder story webpage. Generate one landscape 3:2 photograph, a wholly fictional Japanese male workplace designer aged about 43, short slightly tousled black hair with a little grey at temples, clean shaven, calm thoughtful face, charcoal cotton overshirt over a pale stone t-shirt. In a modest Japanese design studio, seated at a worktable holding a graphite pencil beside plain floorplan sketches and charcoal acoustic felt samples. Subject on right half, upper body and natural hands visible, looking toward soft daylight on the left. Dark textured studio shelving behind, muted neutral gray, near-black #080a09 and stone #edece6 palette, no green cast. Intimate authentic editorial photography, 50mm lens, realistic skin and cotton texture, soft window light, restrained contrast with clearly readable face, no corporate stock smile, no dramatic spotlight. Left quarter subdued architectural negative space. No text, no logo, no signature, no brand product or fabricated certificates. This is a fictional character illustration, not a real company founder or documentary record.

### 最终提示词：走廊通话

Use case: photorealistic-natural. Asset type: landscape 3:2 editorial scene illustrating the inciting incident of a fictional Japanese workplace designer's story. A quiet candid moment in a modest contemporary Tokyo office corridor: a Japanese woman in her 30s wearing a grey knit top, holding a phone to her ear beside a closed glass meeting room, notebook folded at her waist, trying not to disturb colleagues. In the glass background, blurred silhouettes of a small meeting and desks reveal there is no private place for a short call. Subject at right middle third, corridor depth and restrained window light on the left, medium-wide eye-level framing. Muted near-black #080a09, stone grey #edece6, neutral timber and natural skin tones, subtle natural film texture, realistic hands and reflections, no theatrical sadness, no dramatic contrast, no stereotypical overwork imagery. No readable text, signage, logos, watermark, futuristic office pod or product. This is an invented scene illustration, not a real customer or archival photograph.

### 最终提示词：试作场景

Use case: identity-preserve. Asset type: second editorial scene for a fictional founder story, 3:2 landscape photograph. Input image 1: fictional founder identity reference. Preserve this same man's recognizable face, black hair with grey temples, age, charcoal cotton overshirt and stone t-shirt. Show him now standing bent slightly over a modest design workshop table, scrutinizing a small unfinished cardboard architectural model of a simple one-person room and a few acoustic felt and frame material samples. Model is unmistakably a tiny study model, not a finished Tuliko product. One hand rests beside notebook, other adjusts a cardboard wall. Medium wide eye-level composition with face at right upper third, more tabletop visible, side-on gaze down at work. Muted neutral greys, stone #edece6 and near-black #080a09, daylight from left, authentic human skin, imperfect cardboard edges, no green or amber wash. Preserve thoughtful calm persona, no corporate stock smile. No readable text, logos, branding, certificates or invented technical claims. This is an illustrative fictional workshop scene, not documentary footage.

## 事实边界

不使用真人姓名冒充实际创始人，不生成实绩、工厂规模、创办年份、证书、专利、客户背书或性能数据。所有生成图都在页面中注明性质。现有 SPD01 图仅代表当前展示产品，不称作历史样机。当前公司资料与试验报告仍由 /about/ 独立承载。

## 验证记录

- 生产构建通过；19 项自动检查通过（包括 4 项新增的故事顺序、虚构声明、图片与配色检查）。
- 浏览器实际检查桌面 1280 × 720、手机 390 × 844：未出现横向溢出，故事图片全部加载，标题未溢出，未发现控制台错误。
- 测试首屏阅读按钮、试作 / 诞生章节跳转及当前章节标识；手机菜单可打开，Escape 可关闭并将焦点还给菜单按钮。
- 计算实色色对的对比度：浅底正文 5.20:1，深底正文 10.04:1，浅底标题 15.90:1，深底标题 17.53:1。不代表全站无障碍认证。
- 未改动 4175 工程或远程部署。浏览器中的参考副本已关闭，原用户标签保留。
