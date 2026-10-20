(() => {
  "use strict";
  const config = window.PARK_CONFIG;
  const restored = new Set();
  let afterSource = config.images.fallbackAfter;
  const $ = (id) => document.getElementById(id);
  const icons = {
    carousel: '<path d="M12 29 32 10l20 19H12Zm5 4v20m30-20v20M12 54h40M24 34v14m16-14v14M32 10V4m0 0h10l-4 5h-6M24 43h16l-3-5h-9z"/>',
    wheel: '<circle cx="32" cy="25" r="20"/><circle cx="32" cy="25" r="4"/><path d="m32 29-12 28m12-28 12 28M16 57h32M32 5v16m0 8v16M12 25h16m8 0h16M18 11l11 11m6 6 11 11M18 39l11-11m6-6 11-11"/>',
    train: '<path d="M10 26h25v22H10zm25 7h17v15H35M14 26V15h17v11M8 15h25M42 33V21h6v12M8 48h47M16 21h9M14 33h14"/><circle cx="19" cy="51" r="6"/><circle cx="43" cy="51" r="6"/><path d="M45 14c-9-8 11-6 5-13"/>'
  };
  const icon = (key) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;

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
      checkbox.checked ? restored.add(item.id) : restored.delete(item.id);
      renderRestoration();
      $("live-status").textContent = `${item.name}を${checkbox.checked ? "復活させました" : "眠らせました"}。`;
    });
    label.append(checkbox, document.createTextNode(item.name));
    $("restoration-controls").append(label);
  });

  function renderRestoration() {
    const container = $("restoration-layers");
    container.replaceChildren();
    const all = restored.size === config.attractions.length;
    const regions = all ? [null] : config.attractions.filter((item) => restored.has(item.id));
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
    document.querySelectorAll(".hotspot").forEach((element) => {
      const isRestored = restored.has(element.dataset.id);
      element.classList.toggle("is-restored", isRestored);
      element.querySelector(".hotspot-spark").textContent = isRestored ? "✦" : "✧";
    });
  }

  $("reset").addEventListener("click", () => {
    restored.clear();
    document.querySelectorAll("#restoration-controls input").forEach((input) => input.checked = false);
    renderRestoration();
    $("live-status").textContent = "すべてのあかりを眠らせました。";
  });

  function route(focus = true) {
    const id = window.location.hash.slice(1);
    const item = config.attractions.find((entry) => entry.id === id);
    $("map-view").hidden = Boolean(item);
    $("facility-view").hidden = !item;
    if (item) {
      $("facility-view").dataset.theme = item.id;
      $("facility-title").textContent = item.name;
      $("facility-description").textContent = item.description;
      $("facility-number").textContent = `ATTRACTION ${item.number} / ${item.english}`;
      $("facility-icon").innerHTML = icon(item.icon);
      document.title = `${item.name}｜Remember My Park`;
    } else {
      document.title = "Remember My Park｜眠っていた遊園地";
    }
    if (focus) {
      (item ? $("facility-title") : $("map-title")).focus({ preventScroll: true });
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
