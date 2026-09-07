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
