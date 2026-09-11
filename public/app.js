(function () {
  "use strict";

  var PROMPTS = window.PROMPTS || [];
  var TYPE_LABEL = { video: "视频", image: "图片", reverse: "反推" };
  var GRADS = ["g0", "g1", "g2", "g3", "g4", "g5", "g6", "g7"];
  var CAT_GRAD = {
    "城市": 0, "时尚": 1, "美食": 4, "动物": 3, "自然": 2, "国风": 6, "科幻": 5, "星空": 5,
    "产品": 2, "海报": 4, "游戏": 3, "摄影": 3, "插画": 4, "3D": 0, "实用": 7,
    "通用": 5, "字体Logo": 1, "风景": 2, "IP角色": 7
  };

  var state = { type: "all", cat: "all", model: "all", q: "" };

  var el = {
    search: document.getElementById("search"),
    typePills: document.getElementById("type-pills"),
    catChips: document.getElementById("cat-chips"),
    modelChips: document.getElementById("model-chips"),
    stats: document.getElementById("stats"),
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    modal: document.getElementById("modal"),
    modalThumb: document.getElementById("modal-thumb"),
    modalImg: document.getElementById("modal-img"),
    modalEmoji: document.getElementById("modal-emoji"),
    modalTitle: document.getElementById("modal-title"),
    modalBadges: document.getElementById("modal-badges"),
    modalDesc: document.getElementById("modal-desc"),
    modalPrompt: document.getElementById("modal-prompt"),
    modalCopy: document.getElementById("modal-copy"),
    modalClose: document.getElementById("modal-close"),
    toast: document.getElementById("toast")
  };

  var currentItem = null;

  function gradOf(item) {
    var i = CAT_GRAD[item.cat];
    if (i === undefined) i = item.id % GRADS.length;
    return GRADS[i];
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function matches(p) {
    if (state.type !== "all" && p.type !== state.type) return false;
    if (state.cat !== "all" && p.cat !== state.cat) return false;
    if (state.model !== "all" && p.models.indexOf(state.model) === -1) return false;
    if (state.q) {
      var hay = (p.title + " " + p.prompt + " " + p.desc + " " + p.cat + " " +
        p.tags.join(" ") + " " + p.models.join(" ")).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function countBy(fn) {
    var n = 0;
    for (var i = 0; i < PROMPTS.length; i++) if (fn(PROMPTS[i])) n++;
    return n;
  }

  function inType(p) {
    return state.type === "all" || p.type === state.type;
  }

  function renderTypes() {
    var defs = [["all", "全部"], ["video", "视频"], ["image", "图片"], ["reverse", "反推"]];
    el.typePills.innerHTML = defs.map(function (d) {
      var key = d[0], label = d[1];
      var n = key === "all" ? PROMPTS.length : countBy(function (p) { return p.type === key; });
      return '<button class="pill' + (state.type === key ? " active" : "") + '" data-type="' + key + '">' +
        label + '<span class="count">' + n + "</span></button>";
    }).join("");
  }

  function renderCats() {
    var cats = [];
    var seen = {};
    PROMPTS.forEach(function (p) {
      if (inType(p) && !seen[p.cat]) { seen[p.cat] = true; cats.push(p.cat); }
    });
    var html = ['<button class="chip' + (state.cat === "all" ? " active" : "") + '" data-cat="all">全部分类</button>'];
    cats.forEach(function (c) {
      html.push('<button class="chip' + (state.cat === c ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>");
    });
    el.catChips.innerHTML = html.join("");
  }

  function renderModels() {
    var models = [];
    var seen = {};
    PROMPTS.forEach(function (p) {
      if (!inType(p) || (state.cat !== "all" && p.cat !== state.cat)) return;
      p.models.forEach(function (m) {
        if (!seen[m]) { seen[m] = true; models.push(m); }
      });
    });
    var html = ['<button class="chip' + (state.model === "all" ? " active" : "") + '" data-model="all">全部模型</button>'];
    models.forEach(function (m) {
      html.push('<button class="chip' + (state.model === m ? " active" : "") + '" data-model="' + esc(m) + '">' + esc(m) + "</button>");
    });
    el.modelChips.innerHTML = html.join("");
  }

  function renderGrid() {
    var items = PROMPTS.filter(matches);
    el.stats.textContent = "共 " + items.length + " 条提示词";
    el.empty.classList.toggle("hidden", items.length > 0);
    el.grid.innerHTML = items.map(function (p) {
      var thumbImg = p.img
        ? '<img class="thumb-img" loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '" onerror="this.remove()">'
        : "";
      return '<article class="card" data-id="' + p.id + '" tabindex="0" role="button" aria-label="查看提示词：' + esc(p.title) + '">' +
        '<div class="thumb ' + gradOf(p) + '">' + thumbImg +
        (p.img ? "" : '<span class="emoji">' + p.emoji + "</span>") +
        '<span class="badge t-' + p.type + '">' + TYPE_LABEL[p.type] + "</span></div>" +
        '<div class="card-body"><h3>' + esc(p.title) + "</h3>" +
        '<p class="prompt-preview">' + esc(p.prompt) + "</p>" +
        '<div class="meta"><span class="tag">' + esc(p.cat) + "</span>" +
        p.models.slice(0, 3).map(function (m) { return '<span class="tag model">' + esc(m) + "</span>"; }).join("") +
        "</div></div></article>";
    }).join("");
  }

  function syncURL() {
    var url = location.pathname;
    if (state.type !== "all") url += "?media_type=" + state.type;
    history.replaceState(null, "", url);
  }

  function render() {
    renderTypes();
    renderCats();
    renderModels();
    renderGrid();
    syncURL();
  }

  function openModal(p) {
    currentItem = p;
    el.modalThumb.className = "modal-thumb " + gradOf(p) + (p.img ? " with-img" : "");
    if (p.img) {
      el.modalImg.src = p.img;
      el.modalImg.alt = p.title;
      el.modalImg.classList.remove("hidden");
    } else {
      el.modalImg.removeAttribute("src");
      el.modalImg.classList.add("hidden");
    }
    el.modalEmoji.style.display = p.img ? "none" : "";
    el.modalEmoji.className = "emoji-fallback";
    el.modalEmoji.textContent = p.emoji;
    el.modalTitle.textContent = p.title;
    el.modalBadges.innerHTML =
      '<span class="badge t-' + p.type + '">' + TYPE_LABEL[p.type] + "</span>" +
      '<span class="tag">' + esc(p.cat) + "</span>" +
      p.models.map(function (m) { return '<span class="tag model">' + esc(m) + "</span>"; }).join("") +
      p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    el.modalDesc.textContent = p.desc;
    el.modalPrompt.textContent = p.prompt;
    el.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    el.modal.classList.add("hidden");
    document.body.style.overflow = "";
    currentItem = null;
  }

  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function showToast() {
    el.toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.toast.classList.add("hidden");
    }, 1600);
  }

  // 事件：类型筛选
  el.typePills.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-type]");
    if (!btn) return;
    state.type = btn.getAttribute("data-type");
    state.cat = "all";
    state.model = "all";
    render();
  });

  el.catChips.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.cat = btn.getAttribute("data-cat");
    state.model = "all";
    render();
  });

  el.modelChips.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-model]");
    if (!btn) return;
    state.model = btn.getAttribute("data-model");
    render();
  });

  el.search.addEventListener("input", function () {
    state.q = el.search.value.trim();
    renderGrid();
  });

  el.grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (!card) return;
    var id = Number(card.getAttribute("data-id"));
    var p = PROMPTS.find(function (x) { return x.id === id; });
    if (p) openModal(p);
  });

  el.grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    var id = Number(card.getAttribute("data-id"));
    var p = PROMPTS.find(function (x) { return x.id === id; });
    if (p) openModal(p);
  });

  el.modalClose.addEventListener("click", closeModal);
  el.modal.addEventListener("click", function (e) {
    if (e.target === el.modal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !el.modal.classList.contains("hidden")) closeModal();
  });

  el.modalCopy.addEventListener("click", function () {
    if (!currentItem) return;
    copyText(currentItem.prompt, function () {
      el.modalCopy.textContent = "✓ 已复制";
      showToast();
      setTimeout(function () { el.modalCopy.textContent = "📋 复制提示词"; }, 1500);
    });
  });

  // 初始化：支持 ?media_type=video 这类 URL 参数（与参考站参数名一致）
  var param = new URLSearchParams(location.search).get("media_type") ||
    new URLSearchParams(location.search).get("type");
  if (param && TYPE_LABEL[param]) state.type = param;
  render();
})();
