(() => {
  "use strict";
  const config = window.PARK_CONFIG;
  const saved = window.ParkSave.load();
  let progress = saved.state;
  const restored = new Set(progress.restored);
  let devRestored = null;
  let afterSource = config.images.fallbackAfter;
  const $ = (id) => document.getElementById(id);
  const icons = {
    carousel: '<path d="M12 29 32 10l20 19H12Zm5 4v20m30-20v20M12 54h40M24 34v14m16-14v14M32 10V4m0 0h10l-4 5h-6M24 43h16l-3-5h-9z"/>',
    wheel: '<circle cx="32" cy="25" r="20"/><circle cx="32" cy="25" r="4"/><path d="m32 29-12 28m12-28 12 28M16 57h32M32 5v16m0 8v16M12 25h16m8 0h16M18 11l11 11m6 6 11 11M18 39l11-11m6-6 11-11"/>',
    train: '<path d="M10 26h25v22H10zm25 7h17v15H35M14 26V15h17v11M8 15h25M42 33V21h6v12M8 48h47M16 21h9M14 33h14"/><circle cx="19" cy="51" r="6"/><circle cx="43" cy="51" r="6"/><path d="M45 14c-9-8 11-6 5-13"/>'
  };
  const icon = (key) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;

  function renderGuide(id, guide) {
    const container = $(id);
    const image = container.querySelector(".bunny-image");
    const fallback = container.querySelector(".bunny-fallback");
    container.querySelector(".bunny-message").textContent = guide.message;
    image.alt = guide.alt;
    // 同じ画像を再表示する場合は、読み込みとちらつきを増やさない。
    if (image.getAttribute("src") === guide.image) return;
    container.dataset.guideState = "loading";
    image.hidden = true;
    fallback.hidden = false;
    image.onload = () => {
      if (image.getAttribute("src") !== guide.image) return;
      image.hidden = false;
      fallback.hidden = true;
      container.dataset.guideState = "ready";
    };
    image.onerror = () => {
      if (image.getAttribute("src") !== guide.image) return;
      image.hidden = true;
      fallback.hidden = false;
      container.dataset.guideState = "missing";
    };
    image.src = guide.image;
  }

  renderGuide("map-guide", config.guide);

  config.attractions.forEach((item) => {
    const hotspot = document.createElement("a");
    hotspot.href = `#${item.id}`;
    hotspot.className = "hotspot";
    hotspot.dataset.id = item.id;
    hotspot.setAttribute("aria-label", `${item.name}を選ぶ`);
    Object.entries({ left: item.hotspot.x, top: item.hotspot.y, width: item.hotspot.width, height: item.hotspot.height }).forEach(([key, value]) => hotspot.style[key] = `${value}%`);
    hotspot.innerHTML = `<span class="hotspot-label"><span class="hotspot-spark" aria-hidden="true">✧</span>${item.name}<span class="hotspot-arrow" aria-hidden="true">↗</span></span>`;
    $("hotspots").append(hotspot);

    const link = document.createElement("a");
    link.href = `#${item.id}`;
    link.className = "facility-link";
    link.dataset.id = item.id;
    link.innerHTML = `${icon(item.icon)}<span><small>${item.number} / ${item.english}</small><b>${item.name}</b></span><span class="link-arrow" aria-hidden="true">↗</span>`;
    $("facility-links").append(link);

    const label = document.createElement("label");
    label.className = "toggle-label";
    label.dataset.id = item.id;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = item.id;
    checkbox.addEventListener("change", () => {
      if (!devRestored) devRestored = new Set(restored);
      checkbox.checked ? devRestored.add(item.id) : devRestored.delete(item.id);
      renderRestoration();
      $("live-status").textContent = `DEVプレビュー：${item.name}を${checkbox.checked ? "復活させました" : "眠らせました"}。記録は変更していません。`;
    });
    label.append(checkbox, document.createTextNode(item.name));
    $("restoration-controls").append(label);
  });

  function renderRestoration() {
    const container = $("restoration-layers");
    container.replaceChildren();
    const visible = devRestored || restored;
    const all = visible.size === config.attractions.length;
    const regions = all ? [null] : config.attractions.filter((item) => visible.has(item.id));
    regions.forEach((item) => {
      const image = document.createElement("img");
      image.src = afterSource;
      image.alt = "";
      image.className = "map-image restored-image";
      image.draggable = false;
      if (item) {
        const r = item.restoration;
        const mask = `radial-gradient(ellipse ${r.radiusX}% ${r.radiusY}% at ${r.x}% ${r.y}%, #000 0%, #000 58%, transparent 100%)`;
        image.style.maskImage = mask;
        image.style.webkitMaskImage = mask;
      }
      container.append(image);
    });
    $("progress").textContent = `あかり ${restored.size} / ${config.attractions.length}`;
    const normalComplete = restored.size === config.attractions.length;
    renderGuide("map-guide", { ...config.guide, message: normalComplete ? config.guide.restoredMessage : config.guide.message });
    $("ending-invitation").hidden = !normalComplete || Boolean(devRestored);
    $("dev-preview-status").hidden = !devRestored;
    $("dev-preview-status").textContent = devRestored ? `DEVプレビュー ${visible.size}/3・保存されません。あかりの記録は ${restored.size}/3 のままです。` : "";
    $("exit-preview").hidden = !devRestored;
    document.querySelectorAll("#restoration-controls input").forEach(input => input.checked = visible.has(input.value));
    document.querySelectorAll(".hotspot").forEach((element) => {
      const isRestored = visible.has(element.dataset.id);
      element.classList.toggle("is-restored", isRestored);
      element.querySelector(".hotspot-spark").textContent = isRestored ? "✦" : "✧";
    });
  }

  $("reset").addEventListener("click", () => {
    devRestored = new Set();
    renderRestoration();
    $("live-status").textContent = "DEVプレビューのあかりだけを眠らせました。記録は変更していません。";
  });
  $("exit-preview").addEventListener("click", () => { devRestored = null; renderRestoration(); });

  function writeProgress() {
    const ok = window.ParkSave.write(progress);
    $("save-status").classList.toggle("save-warning", !ok);
    $("save-status").textContent = ok ? "✓ 進み具合を自動保存しました。このブラウザーで続きから遊べます。" : "保存できませんでした。このまま遊べますが、画面を閉じると今回の進み具合が失われることがあります。";
    return ok;
  }
  function updateProgress() {
    progress.facilities = game.snapshot();
    progress.restored = window.ParkSave.restoredFrom(progress.facilities);
    progress.lightCount = progress.restored.length;
    restored.clear();
    progress.restored.forEach(id => restored.add(id));
    devRestored = null;
    writeProgress();
    renderRestoration();
  }

  const game = window.createPuzzleGame({
    renderGuide,
    initialState: progress.facilities,
    onChange: updateProgress,
    onRestore(id) {
      $("live-status").textContent = `${config.attractions.find(item => item.id === id).name}が復活しました。`;
    }
  });

  if (saved.status === "corrupt") {
    const repaired = writeProgress();
    if (repaired) $("save-status").textContent = "保存データを読み込めなかったため、最初から始めます。新しい進み具合は自動保存されます。";
  } else if (saved.status === "unavailable") {
    $("save-status").textContent = "このブラウザーでは保存データを読み書きできません。画面を閉じると進み具合が失われます。";
    $("save-status").classList.add("save-warning");
  } else if (saved.status === "loaded") {
    $("save-status").textContent = "✓ 保存した進み具合から再開しました。";
  }

  $("restart-game").addEventListener("click", () => {
    $("restart-error").hidden = true;
    $("restart-dialog").showModal();
  });
  $("cancel-restart").addEventListener("click", () => $("restart-dialog").close());
  $("confirm-restart").addEventListener("click", () => {
    const empty = window.ParkSave.fresh();
    // 保存の初期化に失敗したときは、画面内の記録も消さずに戻せる。
    if (!window.ParkSave.write(empty)) { $("restart-error").hidden = false; return; }
    progress = empty;
    game.reset(progress.facilities);
    restored.clear();
    devRestored = null;
    $("restart-dialog").close();
    $("save-status").classList.remove("save-warning");
    $("save-status").textContent = "記録を初期化しました。あかり0/3から、もう一度遊べます。";
    history.replaceState(null, "", "#map");
    renderRestoration();
    route();
  });

  // 専用画像 → 正式な復活後マップ → 仮マップの順にフォールバックする。
  const endingSources = [...new Set([config.ending.image, config.images.after, config.images.fallbackAfter].filter(Boolean))];
  let endingImageIndex = 0;
  $("ending-image").onerror = () => {
    if (++endingImageIndex < endingSources.length) $("ending-image").src = endingSources[endingImageIndex];
    else { $("ending-image").hidden = true; $("ending-image-status").textContent = "画像を読み込めませんでした。星うさぎと、お話の続きを楽しんでね。"; }
  };
  $("ending-image").src = endingSources[0];
  config.ending.paragraphs.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    $("ending-story").append(p);
  });

  function route(focus = true) {
    let id = window.location.hash.slice(1);
    if (id === "ending" && restored.size !== config.attractions.length) {
      history.replaceState(null, "", "#map");
      id = "map";
    }
    const isEnding = id === "ending";
    const item = config.attractions.find((entry) => entry.id === id);
    $("map-view").hidden = Boolean(item) || isEnding;
    $("facility-view").hidden = !item;
    $("ending-view").hidden = !isEnding;
    if (item || isEnding) { devRestored = null; renderRestoration(); }
    if (item) {
      $("facility-view").dataset.theme = item.id;
      $("facility-title").textContent = item.name;
      $("facility-description").textContent = item.description;
      $("facility-number").textContent = `ATTRACTION ${item.number} / ${item.english}`;
      $("facility-icon").innerHTML = icon(item.icon);
      game.open(item);
      document.title = `${item.name}｜Remember My Park`;
    } else if (isEnding) {
      renderGuide("ending-guide", { ...config.guide, message: config.ending.message });
      document.title = "おしまい｜Remember My Park";
      if (!progress.endingReached) { progress.endingReached = true; writeProgress(); }
    } else {
      document.title = "Remember My Park｜眠っていた遊園地";
    }
    if (focus) {
      (item ? $("facility-title") : isEnding ? $("ending-title") : $("map-title")).focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  window.addEventListener("hashchange", () => route());
  route(false);

  const loadImage = (source) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(source));
    image.src = source;
  });

  async function prepareImages() {
    // 必ず前後セットで採用。片方の欠落・縦横比不一致時は仮画像同士を使う。
    try {
      const [before, after] = await Promise.all([loadImage(config.images.before), loadImage(config.images.after)]);
      const ratio = before.naturalWidth / before.naturalHeight;
      if (Math.abs(ratio - after.naturalWidth / after.naturalHeight) > 0.001) {
        $("asset-status").textContent = "前後画像の縦横比が異なるため、仮マップを表示中です。同じ構図・縦横比の画像に揃えてください。";
        return;
      }
      $("map-before").src = before.src;
      $("map-before").width = before.naturalWidth;
      $("map-before").height = before.naturalHeight;
      $("park-map").style.aspectRatio = String(ratio);
      afterSource = after.src;
      $("map-caption").textContent = "全景マップ";
      $("asset-status").textContent = "前後の画像を読み込みました。復活エリアの位置と構図の重なりを確認してください。";
      renderRestoration();
    } catch {
      $("asset-status").textContent = "現在は仮マップです。assets/maps に park-before.png と park-after.png を両方置くと切り替わります。";
    }
  }
  renderRestoration();
  prepareImages();
})();
