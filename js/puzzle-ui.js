(() => {
  "use strict";
  const P = window.ParkPuzzles;
  const $ = (id) => document.getElementById(id);
  const horseFills = { "白": "#fffdf5", "茶": "#b98059", "灰": "#b2afc1", "黒": "#52475f", "桃": "#f5b0d0" };
  const horse = (name) => `<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M20 36 13 29 22 11 26 5 31 12 40 15 43 27 61 29 68 22 70 31 64 39 62 57 54 57 53 43 34 43 29 57 21 57 24 39Z" fill="${horseFills[name]}" stroke="#785771" stroke-width="2.5" stroke-linejoin="round"/><circle cx="29" cy="19" r="2" fill="#513c66"/><path d="M38 29h15v9H38zM10 59h60" fill="#ffe49c" stroke="#99733f" stroke-width="2"/></svg>`;
  const choiceName = (p, key) => p.kind === "horses" ? P.decorations[key] : `${P.colors[key].name}色`;
  function railSvg(type, rotation) {
    const points = [[50, 0], [100, 50], [50, 100], [0, 50]];
    const [a, b] = P.ports(type, rotation).map(d => points[d]);
    const d = `M${a.join(" ")} ${type === "I" ? "L" : "Q50 50"} ${b.join(" ")}`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" class="track-bed"/><path d="${d}" class="track-ties"/><path d="${d}" class="track-line"/></svg>`;
  }
  window.createPuzzleGame = ({ renderGuide, onRestore, initialState, onChange }) => {
    const root = $("puzzle-root");
    const states = new Map(Object.entries(initialState));
    let facility;
    const newRound = window.ParkSave.newRound;
    const state = () => states.get(facility.id);
    const puzzle = () => P.puzzles[facility.id][state().index];
    const round = () => state().rounds[state().index];
    const speak = (message) => renderGuide("facility-guide", { ...facility.guide, message });
    function headingFocus() { $("puzzle-title")?.focus({ preventScroll: true }); }
    function render() {
      const s = state(), p = puzzle(), r = round();
      $("facility-view").classList.toggle("is-playing", s.started);
      if (!s.started) {
        speak(facility.guide.message);
        root.innerHTML = `<div class="puzzle-intro"><span class="pill">2つの思い出を取り戻そう</span><h2>第1問「${p.title}」</h2><p>${p.kind === "train" ? "線路をタップして回転。途中駅を通って、ゴールへつなごう。" : p.kind === "wheel" ? "手掛かりを読んで、ゴンドラを元の場所へ戻そう。" : "手掛かりを読んで、木馬に1つずつ飾りをつけよう。"}</p><p class="play-note">失敗しても大丈夫。ヒントは3段階あるよ。<br>進み具合は、このブラウザーに自動保存されます。</p><button class="primary-button" data-action="start">★ 第1問をはじめる</button></div>`;
        return;
      }
      root.innerHTML = `<nav class="round-nav" aria-label="問題を選ぶ">${s.rounds.map((v, i) => `<button data-action="round" data-index="${i}" ${i === 1 && !s.rounds[0].cleared ? "disabled" : ""} ${i === s.index ? 'aria-current="step"' : ""}>${v.cleared ? "✓ " : ""}第${i + 1}問${i === 1 && !s.rounds[0].cleared ? "（未開放）" : ""}</button>`).join("")}</nav><div class="puzzle-heading"><span class="pill">思い出のチケット ${s.index + 1} / 2</span><h2 id="puzzle-title" tabindex="-1">${p.title}</h2></div><p class="puzzle-instruction">${p.kind === "horses" ? "木馬ごとに飾りを1つ選ぼう。同じ飾りは使えないよ。" : p.kind === "wheel" ? "いちばん上が1番。時計回り ↻ に、各色を1つずつ置こう。" : "タイルをタップすると右へ90度回転。線路の端をつなごう。"}</p><div class="puzzle-layout"><div class="board-area">${p.kind === "train" ? trainBoard(p, r) : p.kind === "wheel" ? wheelBoard(p, r) : ""}${p.kind !== "train" ? assignments(p, r) : ""}</div>${p.clues ? `<aside class="clue-card" aria-labelledby="clue-title"><h3 id="clue-title">✦ 手掛かりのチケット</h3><ol>${p.clues.map(c => `<li>${c}</li>`).join("")}</ol></aside>` : `<aside class="clue-card"><h3>✦ 運行のしおり</h3><ul><li>左上の入口から、右下の出口へ。</li><li>${p.stations.map(v => `${v.mark} ${v.name}の駅`).join("と")}を通ろう。</li><li>全部のマスを通る必要はないよ。${p.stations.length > 1 ? "駅の順番も自由。" : ""}</li><li>曲線は曲がるだけ。直線はまっすぐ進むよ。</li></ul></aside>`}</div><p class="ready-note">${p.kind === "train" ? "答え合わせで、入口から実際に線路をたどるよ。" : "配置済みの候補を選ぶと自動で交換するよ。すべて埋まると「答え合わせ」が押せるよ。"}</p><div class="puzzle-actions"><button class="primary-button" data-action="check" ${r.solved || (p.kind !== "train" && !P.complete(p, r.values)) ? "disabled" : ""}>答え合わせ</button><button class="secondary-button" data-action="reset">↺ やり直す</button><button class="secondary-button" data-action="hint" ${r.hint >= 3 || r.solved ? "disabled" : ""}>✦ ヒント ${r.hint} / 3</button></div><div id="answer-feedback" role="status" aria-live="polite"></div><aside class="hint-card" id="hint-card" aria-label="星うさぎのヒント" ${r.hint ? "" : "hidden"}><h3>星うさぎのヒント</h3><ol>${p.hints.slice(0, r.hint).map((h, i) => `<li><b>ヒント${i + 1}</b> ${h}</li>`).join("")}</ol></aside><div id="success-card"></div>`;
      if (r.solved) showSuccess();
      else if (r.result) showFeedback(r.result);
    }
    function assignments(p, r) {
      return `<div class="assignment-list ${p.kind}">${r.values.map((value, i) => `<label class="assignment" for="slot-${i}">${p.kind === "horses" ? `<span class="horse-portrait">${horse(p.horses[i])}<b>${p.horses[i]}の木馬</b></span>` : `<span class="slot-label"><b>${i + 1}番</b>${i === 0 ? "・いちばん上" : ""}</span>`}${p.kind === "horses" ? `<span class="decoration-select${value === "bell" ? " has-bell" : ""}">` : ""}<select id="slot-${i}" data-slot="${i}" ${r.solved ? "disabled" : ""} ${p.kind === "wheel" && value ? `style="background-color:${P.colors[value].hex}"` : ""}><option value="">${p.kind === "horses" ? "飾りを選ぶ" : "色を選ぶ"}</option>${p.choices.map(key => `<option value="${key}" ${key === value ? "selected" : ""}>${choiceName(p, key)}${r.values.some((v, j) => j !== i && v === key) ? "（交換）" : ""}</option>`).join("")}</select>${p.kind === "horses" ? `${value === "bell" ? '<span class="selected-bell" aria-hidden="true"><img src="assets/icons/bell.svg" alt="" width="20" height="20">鈴</span>' : ""}</span>` : ""}</label>`).join("")}</div>`;
    }
    function wheelBoard(p, r) {
      const n = p.choices.length;
      return `<div class="wheel-wrap"><p class="wheel-direction">1番から時計回り ↻</p><div class="wheel-board"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 48 29 94h42L50 48" fill="#dbefff" stroke="#9278b4" stroke-width="1.5"/><circle cx="50" cy="46" r="34" fill="#fffdf7" stroke="#b9a2d3" stroke-width="2"/>${r.values.map((_, i) => { const a = i * 2 * Math.PI / n; return `<path d="M50 46L${50 + 34 * Math.sin(a)} ${46 - 34 * Math.cos(a)}" stroke="#c9b7df" stroke-width="1"/>`; }).join("")}<circle cx="50" cy="46" r="5" fill="#fce7a1" stroke="#b18e4a"/><text x="50" y="49" text-anchor="middle" font-size="7" fill="#8c6131">★</text></svg>${r.values.map((v, i) => { const a = i * 2 * Math.PI / n; return `<button class="gondola" data-action="gondola" data-index="${i}" style="left:${50 + 34 * Math.sin(a)}%;top:${46 - 34 * Math.cos(a)}%;--gondola:${v ? P.colors[v].hex : "#fff"}" aria-label="${i + 1}番のゴンドラ、${v ? P.colors[v].name + "色" : "未配置"}。色を選ぶ" ${r.solved ? "disabled" : ""}><b>${i + 1}</b><span>${v ? P.colors[v].name : "？"}</span></button>`; }).join("")}</div></div>`;
    }
    function trainBoard(p, r) {
      return `<div class="train-wrap"><div class="track-entrance">スタート <span>左上の左側から入る</span></div><div class="track-frame" style="--size:${p.size}"><span class="entrance-arrow" aria-hidden="true">→</span><div class="train-board" style="--size:${p.size}" aria-label="${p.size}×${p.size}の線路盤面">${p.types.map((type, i) => {
        const station = p.stations.find(v => v.cell === i);
        const ends = P.ports(type, r.rotations[i]);
        return `<button class="track-tile" data-action="rotate" data-index="${i}" ${r.solved ? "disabled" : ""} aria-label="${Math.floor(i / p.size) + 1}行${i % p.size + 1}列、${station ? station.name + "の駅、" : ""}${type === "I" ? "直線" : "曲線"}、${ends.map(d => P.directionNames[d]).join("と")}を接続。タップで右へ回転">${railSvg(type, r.rotations[i])}<span class="cell-coordinate" aria-hidden="true">${Math.floor(i / p.size) + 1}-${i % p.size + 1}</span>${station ? `<span class="station-mark" aria-hidden="true">${station.mark}</span>` : ""}</button>`;
      }).join("")}</div><span class="exit-arrow" aria-hidden="true">→</span></div><div class="track-exit"><span>右下の右側から出る</span> ゴール</div><p class="station-legend">${p.stations.map(v => `${v.mark} ${v.name}の駅（${Math.floor(v.cell / p.size) + 1}行${v.cell % p.size + 1}列）`).join("　")}</p></div>`;
    }
    function showFeedback(result) {
      const box = $("answer-feedback");
      box.className = "answer-feedback retry";
      box.textContent = result;
    }
    function showSuccess() {
      const s = state(), last = s.index === 1;
      const message = last ? `やったね！ ${facility.name}にあかりが戻ったよ。ぼくもとってもうれしい！` : "やったね、大正解！ ぼくと、もうひとつの思い出も探しにいこう。";
      speak(message);
      $("answer-feedback").textContent = "✓ 正解！ 思い出が戻ったよ。";
      $("answer-feedback").className = "answer-feedback correct";
      $("success-card").innerHTML = `<div class="success-card ${last ? "facility-restored" : ""}"><div class="celebration-stars" aria-hidden="true">✦ ★ ✦</div><h3>${last ? `${facility.name} 復活！` : "第1問 クリア！"}</h3><aside id="celebration-guide" class="bunny-guide celebration-guide" aria-label="星うさぎのお祝い"><figure class="bunny-portrait"><img class="bunny-image" width="824" height="753" alt="" hidden><p class="bunny-fallback">星うさぎ</p></figure><div class="bunny-speech"><h4 class="bunny-name">星うさぎ</h4><p class="bunny-message"></p></div></aside><p>${last ? "思い出のチケットが2枚そろったよ。全景マップでもあかりを見てみよう！" : "次のチケットを探しにいこう！"}</p>${last ? '<a class="primary-button" href="#map">★ あかりを見にいく</a>' : '<button class="primary-button" data-action="next">第2問へすすむ →</button>'}</div>`;
      renderGuide("celebration-guide", { ...facility.guide, message });
    }
    function clearResult() { round().result = null; }
    root.addEventListener("change", (event) => {
      if (!event.target.matches("select[data-slot]")) return;
      const i = Number(event.target.dataset.slot), value = event.target.value, r = round();
      if (r.solved) return;
      const previous = r.values[i];
      const source = value ? r.values.findIndex((v, j) => j !== i && v === value) : -1;
      if (source >= 0) r.values[source] = previous;
      r.values[i] = value;
      clearResult();
      render();
      $(`slot-${i}`).focus({ preventScroll: true });
      $("live-status").textContent = source < 0 ? "" : previous ? "配置を交換しました。" : "選んだ候補を移動し、元の配置先を空にしました。";
      onChange();
    });
    root.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button || button.disabled) return;
      const s = state(), p = puzzle(), r = round(), i = Number(button.dataset.index);
      switch (button.dataset.action) {
        case "start": s.started = true; render(); headingFocus(); onChange(); break;
        case "round":
        case "next": {
          const target = button.dataset.action === "next" ? 1 : i;
          if (target === 1 && !s.rounds[0].cleared) return;
          s.index = target;
          speak(facility.guide.message);
          render(); headingFocus(); onChange(); break;
        }
        case "gondola": $("slot-" + i).focus(); $("slot-" + i).scrollIntoView({ block: "center", behavior: "smooth" }); break;
        case "rotate":
          if (r.solved) return;
          r.rotations[i] = (r.rotations[i] + 1) % 4;
          clearResult();
          render();
          root.querySelector(`[data-action="rotate"][data-index="${i}"]`).focus({ preventScroll: true });
          onChange();
          break;
        case "reset": {
          const cleared = r.cleared;
          s.rounds[s.index] = newRound(p);
          s.rounds[s.index].cleared = cleared;
          speak("ぼくと、もう一度はじめから考えてみよう。");
          render();
          $("live-status").textContent = "今の問題の配置とヒントを最初に戻しました。";
          root.querySelector('[data-action="reset"]').focus({ preventScroll: true });
          onChange();
          break;
        }
        case "hint":
          if (r.solved || r.hint >= 3) return;
          speak(p.hints[r.hint++]);
          render();
          $("live-status").textContent = `ヒント${r.hint}。${p.hints[r.hint - 1]}`;
          $("hint-card").scrollIntoView({ block: "nearest", behavior: "smooth" });
          root.querySelector('[data-action="hint"]').focus({ preventScroll: true });
          onChange();
          break;
        case "check": {
          if (r.solved || (p.kind !== "train" && !P.complete(p, r.values))) return;
          const result = p.kind === "train" ? P.trace(p, r.rotations) : { ok: P.meetsRules(p, r.values) };
          if (result.ok) {
            r.solved = r.cleared = true;
            r.result = null;
            if (s.index === 1) onRestore(facility.id);
            render();
            $("success-card").scrollIntoView({ block: "nearest", behavior: "smooth" });
            root.querySelector(s.index === 1 ? '.success-card a' : '[data-action="next"]').focus({ preventScroll: true });
          } else {
            r.result = p.kind !== "train" ? "↺ もう少し！ 手掛かりと違うところがあるみたい。何度でも試してね。" : result.reason === "stations" ? `↺ ゴールには着いたけれど、${result.missing.map(v => v.name + "の駅").join("と")}を通っていないよ。` : result.reason === "loop" ? "↺ 線路がぐるっと同じ場所に戻っているよ。出口へつなごう。" : `↺ ${Math.floor(result.cell / p.size) + 1}行${result.cell % p.size + 1}列で線路がつながっていないよ。端の向きを見てみよう。`;
            speak("大丈夫、何度でも試せるよ。ぼくも一緒に考えるね。");
            showFeedback(r.result);
          }
          root.querySelectorAll('.trace-step').forEach(element => element.remove());
          root.querySelectorAll('.is-traced').forEach(element => element.classList.remove('is-traced'));
          if (p.kind === "train") result.path.forEach((cell, step) => {
            const tile = root.querySelector(`[data-action="rotate"][data-index="${cell}"]`);
            tile.classList.add("is-traced");
            tile.style.setProperty("--visit-delay", `${step * .11}s`);
            tile.insertAdjacentHTML("beforeend", `<span class="trace-step" aria-hidden="true">${step + 1}</span>`);
          });
          onChange();
          break;
        }
      }
    });
    return {
      snapshot() {
        return Object.fromEntries([...states].map(([id, s]) => [id, { index: s.index, started: s.started, rounds: s.rounds.map(r => ({ values: r.values && [...r.values], rotations: r.rotations && [...r.rotations], hint: r.hint, solved: r.solved, cleared: r.cleared })) }]));
      },
      reset(facilities) {
        states.clear();
        Object.entries(facilities).forEach(([id, s]) => states.set(id, s));
      },
      open(item) {
        facility = item;
        if (!states.has(item.id)) states.set(item.id, { index: 0, started: false, rounds: P.puzzles[item.id].map(newRound) });
        speak(round().hint ? puzzle().hints[round().hint - 1] : item.guide.message);
        render();
      }
    };
  };
})();
