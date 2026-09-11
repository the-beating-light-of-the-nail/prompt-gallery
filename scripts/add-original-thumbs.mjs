// 给 data.js 里最早手写的 45 条提示词（id 1-45，无 img 字段）配主题缩略图。
// 素材复用 _public-repos/gpt4o-image-prompts 未被 import-songguoxs.mjs 用过的图，
// 按"每条一组关键词"打分匹配，一图一用；拷到 public/img/p<id>.jpg（p1-p45 空闲）。
// 用法：node scripts/add-original-thumbs.mjs [--dry]

import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const REPO = 'G:/global-projects/_public-repos/gpt4o-image-prompts/';
const DATA = 'G:/global-projects/prompt-gallery/public/data.js';
const IMG_DIR = 'G:/global-projects/prompt-gallery/public/img/';
const DRY = process.argv.includes('--dry');

const raw = JSON.parse(readFileSync(REPO + 'data/prompts.json', 'utf8'));
const items = raw.items;

// 已被导入脚本用掉的图：拿现网 p46-p285 的内容哈希做排除集
const usedHash = new Set();
for (const m of readFileSync(DATA, 'utf8').matchAll(/img: "(img\/p(\d+)\.jpg)"/g)) {
  const f = IMG_DIR + 'p' + m[2] + '.jpg';
  if (existsSync(f)) usedHash.add(createHash('md5').update(readFileSync(f)).digest('hex'));
}

const md5 = p => createHash('md5').update(readFileSync(REPO + p)).digest('hex');
const itemImg = it => it.coverImage || (it.images || [])[0];

// 手工校准的匹配（dry 跑 + 按主题搜库逐一核对过）：id → 源仓条目 #id。
// 覆盖自动打分；仍走"未被导入用过 + 一图一用 + 文件存在"校验。
const OVERRIDES = {
  1: 92,    // 霓虹雨夜 ← 霓虹玻璃发光
  2: 211,   // 城市日夜延时 ← 灯泡中的城市
  3: 359,   // 高定变装 ← 红色晚礼服女子
  4: 515,   // 美食微距 ← 担担面高级海报
  5: 632,   // 滑板柯基 ← 日式居酒屋狗狗（治愈宠物）
  6: 626,   // 墨韵山水一叶扁舟 ← 黑白水墨-孤舟蓑笠翁
  7: 194,   // 未来城市飞行 ← 装饰艺术未来主义
  8: 67,    // 移轴微缩 ← 可爱微缩场景
  9: 802,   // 破碎之浪 ← 掀起浪花
  10: 1000, // 银河孤树 ← 山顶夜空烟花秀（仓内无星空实拍，取夜景氛围）
  11: 234,  // 一镜到底 ← 霓虹灯下的梦想（梦境穿越感）
  12: 818,  // 花开延时 ← 透明物盛满娇嫩的花
  13: 500,  // 机械少女赛博夜城 ← 赛博黄历
  14: 482,  // 桃花国风少女 ← 传统工笔水墨-仙女（desc 即"工笔+水彩"）
  15: 418,  // 黏土小屋 ← 黏土动画风格海报
  16: 118,  // 产品水花大片 ← 品牌产品数字广告
  17: 780,  // 绘本雪原小狐狸 ← 毛绒纺织品微缩世界（治愈系绘本调性）
  18: 273,  // 红日极简海报 ← 超现实极简概念广告
  19: 772,  // 像素小镇 ← Y2K复古像素风
  20: 863,  // 老照片修复 ← 老照片高清修复（同题材）
  21: 246,  // 罗马雕像蒸汽波 ← 色彩缤纷的手工雕塑
  22: 391,  // 木桌早餐俯拍 ← 咖啡厅室内
  23: 1013, // 雪山银河湖面 ← 水滨夜空烟花（夜景水面倒影替代）
  24: 547,  // 扁平办公插画 ← 手绘日历插画
  25: 41,   // 通用反推·完整描述 ← 卡通角色转超写实（强对比演示图）
  26: 360,  // 通用反推·精准 ← 时尚女性与熊合影
  27: 326,  // 通用反推·双语 ← 电影感街头美女摄影
  28: 316,  // 字体反推·风格 ← 品牌字体
  29: 829,  // 字体反推·细节 ← 人物杂志拼贴封面（typography）
  30: 37,   // Logo反推 ← Logo放进我的世界
  31: 497,  // 风景反推·氛围 ← 日本乡村公交站雨夜（场景氛围）
  32: 1044, // 风景反推·细节 ← 电影照片故事板（场景逐项描述）
  33: 421,  // 风景反推·关键词 ← 超逼真野生动物摄影场景
  34: 325,  // 摄影反推·参数 ← 美女时尚摄影
  35: 683,  // 摄影反推·光线 ← 花园婚纱照（自然光）
  36: 346,  // 摄影反推·风格 ← 人物和大型耿鬼（强风格化）
  37: 572,  // 插画反推·画风 ← 奶油水彩手账
  38: 834,  // 插画反推·技法 ← 数码油画风格半身像（厚涂/油画）
  39: 846,  // 插画反推·关键词 ← 夸张视角插画风格
  40: 159,  // 3D反推·渲染 ← 渲染宝石
  41: 294,  // 3D反推·材质 ← 钩针玩偶（材质质感）
  42: 404,  // 3D反推·关键词 ← 等距视角3D
  43: 382,  // IP反推·形象 ← 3D chibi乙烯基收藏品
  44: 101,  // IP反推·细节 ← Logo变吉祥物
  45: 408,  // IP反推·关键词 ← 角色变3D收藏级Q版人偶
};

// 每条目标：id → 关键词组（命中任一即计分：标题×3 / 标签×2 / prompt×1）
const TARGETS = {
  1:  ['neon', 'rain', 'cyberpunk', '霓虹', 'rainy street'],
  2:  ['city', 'skyline', 'urban', '城市', 'timelapse'],
  3:  ['dress', 'gown', 'fashion model', 'runway', '礼服'],
  4:  ['food', 'pizza', 'cheese', 'ramen', 'burger', '美食'],
  5:  ['corgi', 'dog', 'puppy', 'skateboard', '柯基'],
  6:  ['ink', '水墨', 'ink wash', 'sumi', 'chinese painting'],
  7:  ['futuristic', 'sci-fi', 'cyberpunk city', '未来'],
  8:  ['miniature', 'tilt-shift', 'isometric city', 'diorama'],
  9:  ['wave', 'ocean', 'sea', '浪'],
  10: ['galaxy', 'starry', 'milky way', '星空'],
  11: ['surreal', 'dream', 'portal', 'fantasy world'],
  12: ['flower', 'blossom', 'bloom', 'macro', '花'],
  13: ['cyberpunk', 'android', 'robot girl', 'mecha', '赛博'],
  14: ['hanfu', 'chinese girl', 'cherry blossom', '桃花', '国风', 'ancient chinese'],
  15: ['clay', 'cottage', 'claymation', 'cozy house', 'isometric house'],
  16: ['product', 'splash', 'perfume', 'bottle', '产品'],
  17: ['fox', '狐狸'],
  18: ['minimalist', 'minimal poster', 'sunrise', '极简', 'sun and sea'],
  19: ['pixel', '像素', '8-bit', 'retro game'],
  20: ['vintage photo', 'old photo', 'retro photograph', 'black and white'],
  21: ['statue', 'vaporwave', 'sculpture', 'marble', 'greek'],
  22: ['breakfast', 'coffee', 'flat lay', '早餐', 'cafe table'],
  23: ['mountain', 'lake reflection', 'snow peak', '雪山', 'alps'],
  24: ['flat design', 'flat illustration', 'office', 'business vector'],
  25: ['photorealistic portrait', 'portrait', 'photorealistic'],
  26: ['cinematic', 'film still', 'cinematic shot'],
  27: ['street photography', 'street photo', 'city night'],
  28: ['typography', 'lettering', 'font', '字体'],
  29: ['3d letter', 'serif', 'type design', 'letter'],
  30: ['logo', 'emblem', 'brand mark', 'logo design'],
  31: ['landscape', 'forest', 'valley', '风景'],
  32: ['clouds', 'sunset sky', 'field', 'prairie'],
  33: ['beach', 'island', 'seaside', 'tropical'],
  34: ['bokeh', '85mm', 'photography', 'lens'],
  35: ['golden hour', 'film grain', 'natural light', 'backlight'],
  36: ['moody', 'editorial', 'fashion photography'],
  37: ['watercolor', 'painting', '水彩', 'illustration'],
  38: ['anime', 'cel shading', 'gouache', 'manga'],
  39: ['storybook', 'children book', 'cartoon illustration', '绘本'],
  40: ['3d render', 'blender', 'octane', 'cinema 4d'],
  41: ['matte', 'ceramic', 'clay material', 'porcelain'],
  42: ['isometric', '3d character', 'low poly'],
  43: ['blind box', 'toy figure', '盲盒', 'chibi', 'pop mart'],
  44: ['plush', 'doll', 'mascot', 'stuffed'],
  45: ['vinyl toy', 'cute character', 'designer toy', 'cute 3d'],
};

function score(it, kws) {
  const title = (it.title || '').toLowerCase();
  const tags = (it.tags || []).join(' ').toLowerCase();
  const prompt = ((it.prompts || [])[0] || '').toLowerCase().slice(0, 1500);
  let s = 0;
  for (const k of kws) {
    if (title.includes(k)) s += 3;
    else if (tags.includes(k)) s += 2;
    else if (prompt.includes(k)) s += 1;
  }
  return s;
}

const pickedSrc = new Set(); // 本次一图一用
const results = [];
const misses = [];

for (const [idStr, kws] of Object.entries(TARGETS)) {
  const id = +idStr;
  let best = null;

  // 手工覆盖优先：仍校验 未被用过/一图一用/文件存在/体积
  const ov = OVERRIDES[id];
  if (ov) {
    const it = items.find(x => x.id === ov);
    const img = it && itemImg(it);
    const ok = it && img && existsSync(REPO + img) && /\.jpe?g$/i.test(img) &&
      !pickedSrc.has(img) && !usedHash.has(md5(img)) &&
      statSync(REPO + img).size <= 2.5 * 1024 * 1024;
    if (ok) best = { it, s: 99 };
    else console.log(`⚠ 覆盖项 p${id} ← #${ov} 不可用（已用/缺图/超2.5MB/非jpeg），回退自动匹配`);
  }

  if (!best) {
    // 两轮：先要求 jpeg 且尺寸适中，找不到再放宽到任意格式
    for (const relaxed of [false, true]) {
      const cands = items
        .filter(it => {
          const img = itemImg(it);
          if (!img || !existsSync(REPO + img)) return false;
          if (!relaxed && !/\.jpe?g$/i.test(img)) return false;
          if (pickedSrc.has(img)) return false;
          const h = md5(img);
          if (usedHash.has(h)) return false;
          if (!relaxed && statSync(REPO + img).size > 2.5 * 1024 * 1024) return false;
          return true;
        })
        .map(it => ({ it, s: score(it, kws) }))
        .filter(c => c.s > 0)
        .sort((a, b) => b.s - a.s || a.it.id - b.it.id);
      if (cands.length) { best = cands[0]; break; }
    }
  }
  if (!best) { misses.push(id); continue; }
  const src = itemImg(best.it);
  pickedSrc.add(src);
  results.push({ id, src, repoId: best.it.id, srcTitle: best.it.title, kb: Math.round(statSync(REPO + src).size / 1024), s: best.s });
}

console.log(`匹配成功 ${results.length}/45，失败: ${misses.join(',') || '无'}\n`);
for (const r of results) {
  console.log(`p${String(r.id).padStart(2)} ← #${r.repoId} "${r.srcTitle.slice(0, 30)}" (${r.kb}KB, 得分${r.s}) ${r.src}`);
}

if (DRY) { console.log('\n(dry 模式，未写入)'); process.exit(0); }

// 注入 data.js：在 id 1-45 各条目的 emoji 行后插 img 行
let js = readFileSync(DATA, 'utf8');
const lines = js.split('\n');
let curId = null, injected = 0;
const out = [];
for (let i = 0; i < lines.length; i++) {
  out.push(lines[i]);
  const m = lines[i].match(/^\s*id: (\d+),/);
  if (m) curId = +m[1];
  const em = lines[i].match(/^(\s*)emoji: ".*",\s*$/);
  if (em && curId && TARGETS[curId]) {
    if (!/^\s*img:/.test(lines[i + 1] || '')) {
      copyFileSync(REPO + results.find(r => r.id === curId).src, IMG_DIR + `p${curId}.jpg`);
      out.push(`${em[1]}img: "img/p${curId}.jpg",`);
      injected++;
    }
  }
}
if (injected !== results.length) throw new Error(`注入 ${injected} 条 != 匹配 ${results.length} 条，中止`);
writeFileSync(DATA, out.join('\n'));
console.log(`\n已拷贝 ${results.length} 张图到 public/img/，注入 ${injected} 个 img 字段`);
