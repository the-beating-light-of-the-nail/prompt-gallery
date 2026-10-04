# prompt-gallery（提示词画廊）

对标 opennana.com/awesome-prompt-gallery 的 AI 提示词画廊：搜索 + 类型/分类/模型三重筛选 + 卡片流 + 点开弹窗一键复制。支持 `?media_type=video` URL 参数直达某类型。

- 线上：https://prompts.cdqyfdbymn.me （备用 https://prompt-gallery.r3fbilgebasaran.workers.dev ）
- 纯静态零构建，Cloudflare Workers assets 直传，部署与 git 解耦。

## 更新内容

所有数据在 `public/data.js` 的 `window.PROMPTS` 数组里，往里追加一条即可（id 递增，type 取 video / image / reverse）：

```js
{ id: 46, title: "标题", type: "video", cat: "分类", emoji: "🎬",
  models: ["即梦", "可灵"], tags: ["标签"], desc: "一句话简介", prompt: "完整提示词" }
```

改完 `npm run deploy`（= wrangler deploy）即上线。

## 本地预览

```
npx wrangler dev
```

## 类型说明

- video：AI 视频生成提示词（即梦 / 可灵 / Sora / Veo / Runway）
- image：AI 图片生成提示词（Midjourney / Flux / SD / 即梦）
- reverse：图片反推提示词，把图片发给视觉模型（GPT-4o / Gemini / 豆包 / Kimi）后粘贴使用（源自 prompt-pool 的 7 类 21 条合集）

## 图片资产（不在 git 里，已迁 Vercel Blob）

`public/img/` 的 285 张缩略图**不进版本库**（.gitignore 排除），线上图片走 **Vercel Blob**（`kixmteksehtzcdmo.public.blob.vercel-storage.com/img/`），`data.js` 里的 `img` 字段已是 Blob 外链。本机 `public/img/` 保留一份源图备份。**注意：新机器 clone 后不缺图**（图片不再依赖本目录）；CF 线上站（prompts.cdqyfdbymn.me）当前部署仍是本地图版本，下次 `wrangler deploy` 后会切到 Blob 图。
