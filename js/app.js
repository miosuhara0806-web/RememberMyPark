(() => {
  "use strict";
  const config = window.PARK_CONFIG;
  const saved = window.ParkSave.load();
  let progress = saved.state;
  const restored = new Set(progress.restored);
  let afterSource = config.images.fallbackAfter;
  const $ = (id) => document.getElementById(id);
  const icons = {
    carousel: '<path d="M12 29 32 10l20 19H12Zm5 4v20m30-20v20M12 54h40M24 34v14m16-14v14M32 10V4m0 0h10l-4 5h-6M24 43h16l-3-5h-9z"/>',
    wheel: '<circle cx="32" cy="25" r="20"/><circle cx="32" cy="25" r="4"/><path d="m32 29-12 28m12-28 12 28M16 57h32M32 5v16m0 8v16M12 25h16m8 0h16M18 11l11 11m6 6 11 11M18 39l11-11m6-6 11-11"/>',
    train: '<path d="M10 26h25v22H10zm25 7h17v15H35M14 26V15h17v11M8 15h25M42 33V21h6v12M8 48h47M16 21h9M14 33h14"/><circle cx="19" cy="51" r="6"/><circle cx="43" cy="51" r="6"/><path d="M45 14c-9-8 11-6 5-13"/>'
  };
  const icon = (key) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;

  const guideRequests = new WeakMap();
  function renderGuide(id, guide) {
    const container = $(id);
    const image = container.querySelector(".bunny-image");
    const fallback = container.querySelector(".bunny-fallback");
    container.querySelector(".bunny-message").textContent = guide.message;
    image.alt = guide.alt;
    // 読み込み中・表示済みの同じ画像は再利用し、失敗後の再訪では再試行する。
    const previous = guideRequests.get(image);
    if (previous?.source === guide.image && container.dataset.guideState !== "missing") return;
    const request = { source: guide.image, loader: new Image() };
    guideRequests.set(image, request);
    container.dataset.guideState = "loading";
    image.hidden = true;
    fallback.hidden = false;
    request.loader.onload = () => {
      // 施設移動前の画像の完了通知で、今の案内を上書きしない。
      if (guideRequests.get(image) !== request) return;
      image.src = guide.image;
      image.hidden = false;
      fallback.hidden = true;
      container.dataset.guideState = "ready";
    };
    request.loader.onerror = () => {
      if (guideRequests.get(image) !== request) return;
      image.hidden = true;
      fallback.hidden = false;
      container.dataset.guideState = "missing";
    };
    request.loader.src = guide.image;
    // キャッシュ済み画像は、イベント待ちだけにせず表示状態を確定する。
    if (request.loader.complete) {
      if (request.loader.naturalWidth > 0) request.loader.onload();
      else request.loader.onerror();
    }
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
  });

  function renderRestoration() {
    const container = $("restoration-layers");
    container.replaceChildren();
    const visible = restored;
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
    $("ending-invitation").hidden = !normalComplete;
    document.querySelectorAll(".hotspot").forEach((element) => {
      const isRestored = visible.has(element.dataset.id);
      element.classList.toggle("is-restored", isRestored);
      element.querySelector(".hotspot-spark").textContent = isRestored ? "✦" : "✧";
    });
  }

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
    $("restart-dialog").close();
    $("save-status").classList.remove("save-warning");
    $("save-status").textContent = "記録を初期化しました。あかり0/3から、もう一度遊べます。";
    history.replaceState(null, "", "#map");
    renderRestoration();
    route();
  });

  // 専用画像 → 正式な復活後マップ → 仮マップの順にフォールバックする。
  const endingSources = [...new Set([config.ending.image, config.images.after, config.images.fallbackAfter].filter(Boolean))];
  function loadEndingImage(image, status) {
    let index = 0;
    image.onerror = () => {
      if (++index < endingSources.length) image.src = endingSources[index];
      else {
        image.hidden = true;
        if (status) status.textContent = "画像を読み込めませんでした。星うさぎと、お話の続きを楽しんでね。";
      }
    };
    image.src = endingSources[0];
  }
  const endingImage = $("ending-image");
  loadEndingImage(endingImage, $("ending-image-status"));
  config.ending.paragraphs.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    $("ending-story").append(p);
  });

  const endingView = $("ending-view");
  const nightView = $("ending-video-view");
  const nightVideo = $("ending-video");
  const nightBackground = $("ending-video-background");
  const nightInvitation = $("ending-video-invitation");
  const nightLoading = $("ending-video-loading");
  const replayNight = $("replay-ending-video");
  const skipNight = $("skip-ending-video");
  const endingTransition = $("ending-transition");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let nightPlayback;
  let endingAnimation;

  function focusView(element) {
    element.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showNightView() {
    if (!nightBackground.hasAttribute("src")) loadEndingImage(nightBackground);
    endingView.hidden = true;
    nightView.hidden = false;
    document.title = "夜の遊園地｜Remember My Park";
  }

  function showStaticEnding({ focus = true, reveal = false, align = false, failed = false } = {}) {
    nightView.hidden = true;
    endingView.classList.toggle("is-revealing", reveal);
    endingView.classList.toggle("is-aligning", align);
    endingView.classList.remove("is-showing-story");
    endingView.hidden = false;
    $("ending-video-error").hidden = !failed;
    renderGuide("ending-guide", { ...config.guide, message: config.ending.message });
    document.title = "おしまい｜Remember My Park";
    if (!progress.endingReached) { progress.endingReached = true; writeProgress(); }
    if (focus) focusView($("ending-title"));
  }

  function stopNightPlayback() {
    if (!nightPlayback) return;
    // 画面を離れた再生のイベントで、次の画面や再生を切り替えない。
    nightPlayback.abort();
    nightPlayback = undefined;
    nightVideo.pause();
    nightVideo.removeAttribute("src");
    nightVideo.load();
    nightVideo.classList.remove("is-playing");
    nightVideo.hidden = true;
    nightLoading.hidden = true;
    nightInvitation.hidden = false;
  }

  function clearEndingAnimation() {
    endingAnimation?.cancel();
    endingAnimation = undefined;
    endingTransition.hidden = true;
  }

  function canShowEndingLight() {
    return !reducedMotion.matches && typeof endingTransition.animate === "function";
  }

  async function playEndingLight({ delay = 0, atPeak } = {}) {
    const peakOpacity = .88;
    const easing = "ease-in-out";
    endingTransition.hidden = false;
    const brighten = endingTransition.animate({ opacity: [0, peakOpacity] }, { duration: 340, delay, easing, fill: "both" });
    endingAnimation = brighten;
    try {
      await brighten.finished;
      atPeak?.();
      endingView.classList.add("is-showing-story");
      const clear = endingTransition.animate({ opacity: [peakOpacity, 0] }, { duration: 520, easing, fill: "both" });
      endingAnimation = clear;
      brighten.cancel();
      await clear.finished;
      clearEndingAnimation();
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    }
  }

  function endNightVideo() {
    const glow = canShowEndingLight();
    const from = nightVideo.getBoundingClientRect();
    const fromRadius = parseFloat(getComputedStyle(nightVideo.parentElement).borderTopLeftRadius);
    const align = glow && typeof endingImage.animate === "function"
      && endingImage.complete && endingImage.naturalWidth > 0
      && endingImage.getAttribute("src") === config.ending.image && from.width > 0 && from.height > 0;
    stopNightPlayback();
    showStaticEnding({ reveal: glow, align });
    if (align) alignEndingImage(from, fromRadius);
    if (glow) playEndingLight({ delay: align ? 300 : 0 });
  }

  function alignEndingImage(from, fromRadius) {
    // 動画の最後は全景が少し寄った構図。静止画をその位置と切り抜きから元の枠へ戻す。
    const to = endingImage.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const { top, right, bottom, left } = config.ending.videoLastFrameCrop;
    const scaleX = from.width / (to.width * (1 - left - right));
    const scaleY = from.height / (to.height * (1 - top - bottom));
    const x = from.left - to.left - left * to.width * scaleX;
    const y = from.top - to.top - top * to.height * scaleY;
    const toRadius = getComputedStyle(endingImage).borderTopLeftRadius;
    const frames = [
      {
        transform: `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`,
        clipPath: `inset(${top * 100}% ${right * 100}% ${bottom * 100}% ${left * 100}% round ${fromRadius / scaleX}px / ${fromRadius / scaleY}px)`
      },
      { transform: "none", clipPath: `inset(0% round ${toRadius} / ${toRadius})` }
    ];
    endingImage.animate(frames.map(frame => ({ ...frame, transformOrigin: "top left" })), {
      duration: 640, easing: "ease-in-out", fill: "backwards"
    });
  }

  function leaveNightVideo(failed = false) {
    if (nightView.hidden || endingAnimation) return;
    if (failed || !canShowEndingLight()) {
      stopNightPlayback();
      showStaticEnding({ failed });
      return;
    }

    // 音をすぐに止め、光がいちばん明るいところで途中の映像から全景へ切り替える。
    nightPlayback?.abort();
    nightVideo.pause();
    nightLoading.hidden = true;
    playEndingLight({ atPeak() {
      stopNightPlayback();
      showStaticEnding({ reveal: true });
    } });
  }

  function playNightVideo() {
    if (nightPlayback || endingAnimation) return;
    showNightView();
    nightInvitation.hidden = true;
    nightVideo.hidden = false;
    focusView(skipNight);

    nightPlayback = new AbortController();
    const { signal } = nightPlayback;
    const fail = () => { if (!signal.aborted) leaveNightVideo(true); };
    let loadingTimeout;
    const stopWaiting = () => clearTimeout(loadingTimeout);
    const waitForVideo = () => {
      nightLoading.hidden = false;
      stopWaiting();
      loadingTimeout = setTimeout(fail, 20000);
    };
    signal.addEventListener("abort", stopWaiting, { once: true });
    nightVideo.addEventListener("waiting", waitForVideo, { signal });
    nightVideo.addEventListener("playing", () => {
      stopWaiting();
      nightLoading.hidden = true;
      nightVideo.classList.add("is-playing");
    }, { signal });
    nightVideo.addEventListener("ended", endNightVideo, { signal });
    nightVideo.addEventListener("error", fail, { signal });
    waitForVideo();
    // iOSの音声付きインライン再生のため、ユーザー操作内で同期的に再生を要求する。
    nightVideo.src = config.ending.video;
    nightVideo.play().catch(fail);
  }

  $("play-ending-video").addEventListener("click", playNightVideo);
  replayNight.addEventListener("click", playNightVideo);
  skipNight.addEventListener("click", () => leaveNightVideo());

  function route(focus = true) {
    clearEndingAnimation();
    endingImage.getAnimations?.().forEach(animation => animation.cancel());
    stopNightPlayback();
    let id = window.location.hash.slice(1);
    if (id === "ending" && restored.size !== config.attractions.length) {
      history.replaceState(null, "", "#map");
      id = "map";
    }
    const isEnding = id === "ending";
    const item = config.attractions.find((entry) => entry.id === id);
    $("map-view").hidden = Boolean(item) || isEnding;
    $("facility-view").hidden = !item;
    nightView.hidden = true;
    endingView.hidden = true;
    if (item || isEnding) renderRestoration();
    if (item) {
      $("facility-view").dataset.theme = item.id;
      $("facility-title").textContent = item.name;
      $("facility-description").textContent = item.description;
      $("facility-number").textContent = `ATTRACTION ${item.number} / ${item.english}`;
      $("facility-icon").innerHTML = icon(item.icon);
      game.open(item);
      document.title = `${item.name}｜Remember My Park`;
    } else if (isEnding) {
      if (progress.endingReached) showStaticEnding({ focus });
      else {
        showNightView();
        if (focus) focusView($("ending-video-title"));
      }
      return;
    } else {
      document.title = "Remember My Park｜眠っていた遊園地";
    }
    if (focus) focusView(item ? $("facility-title") : $("map-title"));
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
        return;
      }
      $("map-before").src = before.src;
      $("map-before").width = before.naturalWidth;
      $("map-before").height = before.naturalHeight;
      $("park-map").style.aspectRatio = String(ratio);
      afterSource = after.src;
      $("map-caption").textContent = "全景マップ";
      renderRestoration();
    } catch {
      // 読み込めない場合も、前後を揃えた代替マップで操作を続けられる。
    }
  }
  renderRestoration();
  prepareImages();
})();
