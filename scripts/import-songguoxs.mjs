// 从 _public-repos/gpt4o-image-prompts（松果先森社区合集）精选商用场景提示词，
// 追加到 public/data.js 的 window.PROMPTS 末尾。
// 用法：node scripts/import-songguoxs.mjs [--dry]
// 许可注意：源仓库无 license，仅精选少量并逐条标注来源；整包搬运勿做。

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';

const SRC = 'G:/global-projects/_public-repos/gpt4o-image-prompts/data/prompts.json';
const REPO = 'G:/global-projects/_public-repos/gpt4o-image-prompts/';
const DATA = new URL('../public/data.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const IMG_DIR = new URL('../public/img/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DRY = process.argv.includes('--dry');

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const items = raw.items;

// 商用场景优先：tag → [目标分类, emoji, 配额]
const PLAN = [
  ['product',     '产品',    '📦', 40],
  ['branding',    '品牌',    '🏷️', 25],
  ['logo',        '字体Logo','🔤', 25],
  ['typography',  '字体Logo','🔤', 15],
  ['poster',      '海报',    '🖼️', 25],
  ['ui',          'UI',      '🖥️', 20],
  ['interior',    '室内',    '🛋️', 20],
  ['food',        '美食',    '🍜', 15],
  ['3d',          '3D',      '🧊', 20],
  ['fashion',     '时尚',    '👗', 15],
  ['paper-craft', '纸艺',    '✂️', 10],
  ['toy',         'IP角色',  '🧸', 10],
];

const TAG_ZH = {
  product: '产品图', branding: '品牌', logo: 'Logo', typography: '字体',
  poster: '海报', ui: '界面', interior: '室内设计', food: '美食摄影',
  '3d': '3D', fashion: '时尚', 'paper-craft': '纸艺手工', toy: '玩具',
  photography: '摄影', portrait: '人像', minimalist: '极简', neon: '霓虹',
  retro: '复古', pixel: '像素风', cartoon: '卡通', architecture: '建筑',
  vehicle: '载具', animal: '动物', nature: '自然', landscape: '风景',
  fantasy: '奇幻', futuristic: '未来感', character: '角色', creative: '创意',
  sculpture: '雕塑', concept: '概念', 'still-life': '静物',
};

const MODEL_ZH = {
  'Nano banana pro': 'Nano Banana Pro',
  'Grok': 'Grok',
  '通义Z-Image-Turbo': '通义 Z-Image',
};

const dataJs = readFileSync(DATA, 'utf8');
const existingTitles = new Set(
  [...dataJs.matchAll(/title: "((?:[^"\\]|\\.)*)"/g)].map(m => m[1])
);
let maxId = Math.max(...[...dataJs.matchAll(/id: (\d+)/g)].map(m => +m[1]));

// 图片：public/img 一律先清空，保证与本次选中结果一致（dry 模式不动磁盘）
if (!DRY) {
  mkdirSync(IMG_DIR, { recursive: true });
  for (const f of readdirSync(IMG_DIR)) unlinkSync(IMG_DIR + f);
}

const used = new Set();
const picked = [];
let imgMissing = 0;
for (const [tag, cat, emoji, quota] of PLAN) {
  const pool = items
    .filter(i => (i.tags || []).includes(tag) && !used.has(i.id))
    .sort((a, b) => (b.model ? 1 : 0) - (a.model ? 1 : 0) || b.id - a.id); // 有模型标注优先、新的优先
  let n = 0;
  for (const it of pool) {
    if (n >= quota) break;
    if (!it.prompts?.[0] || existingTitles.has(it.title)) continue;
    used.add(it.id);
    n++;
    const id = ++maxId;
    const srcName = it.source?.name ? it.source.name.replace(/^@/, '') : null;
    const zhTags = (it.tags || []).map(t => TAG_ZH[t]).filter(Boolean).slice(0, 4);
    // 封面图拷进站点 public/img/p<id>.jpg，没有图的条目退回 emoji 兜底
    let img = null;
    const srcImg = it.coverImage || (it.images || [])[0];
    if (srcImg) {
      if (DRY) {
        img = existsSync(REPO + srcImg) ? `img/p${id}.jpg` : null;
        if (!img) imgMissing++;
      } else {
        try {
          copyFileSync(REPO + srcImg, `${IMG_DIR}p${id}.jpg`);
          img = `img/p${id}.jpg`;
        } catch { imgMissing++; }
      }
    } else imgMissing++;
    picked.push({
      id,
      title: it.title,
      type: 'image',
      cat,
      emoji,
      models: [MODEL_ZH[it.model] || '通用'],
      tags: zhTags.length ? zhTags : [cat],
      desc: srcName ? `社区精选 · 来源 X @${srcName}` : '社区精选 · 来源见合集仓库',
      prompt: it.prompts[0].trim(),
      img,
    });
  }
}

const block = picked.map(p =>
  '  {\n' + [
    `    id: ${p.id},`,
    `    title: ${JSON.stringify(p.title)},`,
    `    type: "image",`,
    `    cat: ${JSON.stringify(p.cat)},`,
    `    emoji: ${JSON.stringify(p.emoji)},`,
    ...(p.img ? [`    img: ${JSON.stringify(p.img)},`] : []),
    `    models: ${JSON.stringify(p.models)},`,
    `    tags: ${JSON.stringify(p.tags)},`,
    `    desc: ${JSON.stringify(p.desc)},`,
    `    prompt: ${JSON.stringify(p.prompt)}`
  ].join('\n') + '\n  }'
).join(',\n');

const section = `\n  /* ===== 商用场景精选（GPT Image / Nano Banana，导入自社区合集并逐条标注来源，\n     源数据含原始 X 链接：_public-repos/gpt4o-image-prompts/data/prompts.json）===== */\n\n`;

const idx = dataJs.lastIndexOf('\n];');
if (idx < 0) throw new Error('data.js 末尾找不到 "\\n];"');

console.log(`选中 ${picked.length} 条：`);
const byCat = {};
picked.forEach(p => byCat[p.cat] = (byCat[p.cat] || 0) + 1);
console.log(Object.entries(byCat).map(([c, n]) => `${c} ${n}`).join(' · '));
const withImg = picked.filter(p => p.img).length;
console.log(`带图: ${withImg}/${picked.length}${imgMissing ? `（缺图 ${imgMissing} 条，回退 emoji）` : ''}`);

if (DRY) { console.log('(dry 模式，未写入)'); process.exit(0); }

copyFileSync(DATA, DATA + '.bak-20260911');
writeFileSync(DATA, dataJs.slice(0, idx) + ',' + section + block + dataJs.slice(idx));
console.log(`已写入 ${DATA}（备份 data.js.bak-20260911）`);
