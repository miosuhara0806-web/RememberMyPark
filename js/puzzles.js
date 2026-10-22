/* データと純粋な判定処理。方向は描画・追跡ともに 北=0、東=1、南=2、西=3。 */
(() => {
  "use strict";
  const decorations = { star: "★ 星", flower: "✿ 花", moon: "☾ 月", bell: "🔔 鈴", ribbon: "୨୧ リボン" };
  const colors = {
    pink: { name: "桃", hex: "#f6b5d4" }, blue: { name: "青", hex: "#96d4f5" },
    yellow: { name: "黄", hex: "#ffe48c" }, green: { name: "緑", hex: "#a7e5c7" },
    purple: { name: "紫", hex: "#cdb7ed" }, orange: { name: "橙", hex: "#ffc391" }
  };
  const puzzles = {
    carousel: [
      {
        title: "木馬たちの忘れもの", kind: "horses", horses: ["白", "茶", "灰", "黒"],
        choices: ["star", "flower", "moon", "bell"], solution: ["star", "flower", "moon", "bell"],
        clues: ["星の飾りは、白か黒の木馬についていた。", "月の飾りは、灰か白の木馬についていた。", "鈴の飾りは、黒か茶の木馬についていた。", "茶色の木馬には、星も鈴もついていなかった。"],
        rules: [["allowed", "star", [0, 3]], ["allowed", "moon", [2, 0]], ["allowed", "bell", [3, 1]], ["excluded", 1, ["star", "bell"]]],
        hints: ["ぼくと一緒に、候補が少ない木馬から考えよう。飾りは1つずつしか使えないよ。", "茶色には星も鈴もつかないね。月の候補にも茶色は入っていないよ。", "茶色の木馬には、花の飾りをつけてみよう。"],
        hintFacts: [{ rule: 3 }, { slot: 1, value: "flower" }, { slot: 1, value: "flower" }]
      },
      {
        title: "思い出の飾りを探して", kind: "horses", horses: ["白", "茶", "灰", "黒", "桃"],
        choices: ["star", "moon", "flower", "bell", "ribbon"], solution: ["moon", "bell", "star", "ribbon", "flower"],
        clues: ["星の飾りは、灰か黒の木馬についていた。", "月の飾りは、白か桃の木馬についていた。", "花の飾りは、桃か茶の木馬についていた。", "鈴の飾りは、茶か灰の木馬についていた。", "リボンの飾りは、黒か白の木馬についていた。", "白い木馬にリボンはついていなかった。"],
        rules: [["allowed", "star", [2, 3]], ["allowed", "moon", [0, 4]], ["allowed", "flower", [4, 1]], ["allowed", "bell", [1, 2]], ["allowed", "ribbon", [3, 0]], ["excluded", 0, ["ribbon"]]],
        hints: ["ぼくは「ついていなかった」という手掛かりに注目しているよ。候補を1つ消すと、次も決まるかも。", "リボンの候補は黒か白。でも、白にはついていなかったんだね。", "黒い木馬にはリボンをつけよう。星は残った候補を考えてね。"],
        hintFacts: [{ rule: 5 }, { slot: 3, value: "ribbon" }, { slot: 3, value: "ribbon" }]
      }
    ],
    "ferris-wheel": [
      {
        title: "眠ったゴンドラ", kind: "wheel", choices: ["pink", "blue", "yellow", "green", "purple"],
        solution: ["pink", "blue", "yellow", "green", "purple"],
        clues: ["桃色のゴンドラは、いちばん上にあった。", "紫色のゴンドラは、緑色のすぐ時計回り側にあった。", "黄色のゴンドラは、青色のすぐ時計回り側にあった。", "青色のゴンドラは、桃色のすぐ時計回り側にあった。"],
        rules: [["at", "pink", 0], ["next", "green", "purple"], ["next", "blue", "yellow"], ["next", "pink", "blue"]],
        hints: ["ぼくと、いちばん上の1番から始めよう。番号は時計回りに増えるよ。", "桃のすぐ時計回り側が青、青のすぐ時計回り側が黄。3色が続いているね。", "1番は桃、2番は青だよ。次の色は手掛かりから探そう。"],
        hintFacts: [{ slot: 0, value: "pink" }, { rule: 2 }, { slot: 1, value: "blue" }]
      },
      {
        title: "空に浮かぶ6つの色", kind: "wheel", choices: ["pink", "purple", "orange", "green", "blue", "yellow"],
        solution: ["pink", "purple", "orange", "green", "blue", "yellow"],
        clues: ["桃色のゴンドラは、いちばん上にあった。", "緑色のゴンドラは、桃色の真向かいにあった。", "青色と紫色のゴンドラは、真向かい同士だった。", "橙色のゴンドラは、紫色のすぐ時計回り側にあった。", "黄色のゴンドラは、桃色の隣にあった。"],
        rules: [["at", "pink", 0], ["opposite", "pink", "green"], ["opposite", "blue", "purple"], ["next", "purple", "orange"], ["adjacent", "pink", "yellow"]],
        hints: ["6つのゴンドラでは、3つ先が真向かいだよ。ぼくと向かい合う組を探そう。", "桃は1番だから緑は4番。黄は桃の隣の2番か6番だね。", "紫は2番に置いてみよう。すぐ時計回りの3番は橙になるよ。"],
        hintFacts: [{ rule: 1 }, { slot: 3, value: "green" }, { slot: 1, value: "purple" }]
      }
    ],
    "mini-train": [
      {
        title: "はじめての運行再開", kind: "train", size: 3,
        types: ["I", "C", "C", "C", "C", "C", "C", "I", "I"],
        initial: [0, 0, 1, 0, 2, 2, 3, 0, 0],
        start: { cell: 0, port: 3 }, goal: { cell: 8, port: 1 }, stations: [{ cell: 4, name: "星", mark: "★" }],
        route: [0, 1, 4, 3, 6, 7, 8],
        hints: ["ぼくの列車は左上の矢印から入るよ。線路の端どうしをつなごう。使わないマスがあっても大丈夫。", "上の段は、左から右へ。そのあと真ん中の星の駅へ曲がってみよう。", "左上の直線を横向きにして、その右のカーブを左と下につなごう。"],
        hintFacts: [{ cell: 0, ports: [3, 1] }, { cell: 1, ports: [3, 2] }, { cell: 1, ports: [3, 2] }]
      },
      {
        title: "よりみち駅をめぐろう", kind: "train", size: 4,
        types: ["I", "I", "C", "C", "C", "I", "C", "C", "I", "C", "C", "C", "C", "C", "C", "I"],
        initial: [0, 0, 0, 1, 0, 0, 2, 3, 1, 0, 1, 0, 2, 1, 3, 0],
        start: { cell: 0, port: 3 }, goal: { cell: 15, port: 1 },
        stations: [{ cell: 5, name: "星", mark: "★" }, { cell: 9, name: "花", mark: "✿" }],
        route: [0, 1, 2, 6, 5, 4, 8, 12, 13, 9, 10, 14, 15],
        hints: ["ぼくと星・花の2駅を巡ろう。どちらが先でもいいし、全部のマスを使わなくてもいいよ。", "星の駅は直線だね。横向きにすると左右のマスから寄れるよ。左下を回って花の駅へ向かおう。", "上の段の左から3マス目は、左から入って下へ。その下は上から入って左へつなごう。"],
        hintFacts: [{ cell: 5, ports: [3, 1] }, { cell: 5, ports: [3, 1] }, { cell: 6, ports: [0, 3] }]
      }
    ]
  };
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const directionNames = ["上", "右", "下", "左"];
  const opposite = (d) => (d + 2) % 4;
  function ports(type, rotation) {
    return [rotation % 4, (rotation + (type === "I" ? 2 : 1)) % 4];
  }
  function neighbor(size, cell, direction) {
    const row = Math.floor(cell / size) + directions[direction][0];
    const col = cell % size + directions[direction][1];
    return row < 0 || col < 0 || row >= size || col >= size ? -1 : row * size + col;
  }
  function complete(puzzle, values) {
    return values.length === puzzle.choices.length && values.every(v => puzzle.choices.includes(v)) && new Set(values).size === values.length;
  }
  function meetsRules(puzzle, values) {
    if (!complete(puzzle, values)) return false;
    const n = values.length, pos = (v) => values.indexOf(v);
    return puzzle.rules.every(([type, a, b]) => {
      if (type === "allowed") return b.includes(pos(a));
      if (type === "excluded") return !b.includes(values[a]);
      if (type === "at") return pos(a) === b;
      if (type === "next") return (pos(a) + 1) % n === pos(b);
      if (type === "opposite") return (pos(a) + n / 2) % n === pos(b);
      if (type === "adjacent") return (pos(a) + 1) % n === pos(b) || (pos(b) + 1) % n === pos(a);
      throw new Error(`Unknown rule: ${type}`);
    });
  }
  function trace(puzzle, rotations) {
    const path = [];
    let cell = puzzle.start.cell, entry = puzzle.start.port;
    while (true) {
      if (path.includes(cell)) return { ok: false, reason: "loop", path, cell };
      const ends = ports(puzzle.types[cell], rotations[cell]);
      if (!ends.includes(entry)) return { ok: false, reason: "broken", path, cell };
      path.push(cell);
      const exit = ends.find(d => d !== entry);
      if (cell === puzzle.goal.cell && exit === puzzle.goal.port) {
        const missing = puzzle.stations.filter(s => !path.includes(s.cell));
        return { ok: !missing.length, reason: missing.length ? "stations" : "goal", path, missing };
      }
      const next = neighbor(puzzle.size, cell, exit);
      if (next < 0) return { ok: false, reason: "outside", path, cell };
      cell = next;
      entry = opposite(exit);
    }
  }
  function routeRotations(puzzle, route = puzzle.route) {
    const result = [...puzzle.initial];
    route.forEach((cell, i) => {
      const entry = i ? directions.findIndex((_, d) => neighbor(puzzle.size, cell, d) === route[i - 1]) : puzzle.start.port;
      const exit = i === route.length - 1 ? puzzle.goal.port : directions.findIndex((_, d) => neighbor(puzzle.size, cell, d) === route[i + 1]);
      result[cell] = [0, 1, 2, 3].find(r => { const ends = ports(puzzle.types[cell], r); return ends.includes(entry) && ends.includes(exit); });
      if (result[cell] === undefined) throw new Error(`Invalid route at ${cell}`);
    });
    return result;
  }
  // 回転の全組合せの代わりに、各マスの形状で実現できる全単純経路を列挙。
  // 2端子線路の走行は分岐しないため、閉路以外の全走行を網羅できる。
  function enumerateRoutes(puzzle, requireStations = true) {
    const routes = [];
    function walk(cell, entry, visited) {
      if (visited.includes(cell)) return;
      const path = [...visited, cell];
      for (let exit = 0; exit < 4; exit++) {
        if (exit === entry || (opposite(entry) === exit) !== (puzzle.types[cell] === "I")) continue;
        if (cell === puzzle.goal.cell && exit === puzzle.goal.port) {
          if (!requireStations || puzzle.stations.every(s => path.includes(s.cell))) routes.push(path);
          continue;
        }
        const next = neighbor(puzzle.size, cell, exit);
        if (next >= 0) walk(next, opposite(exit), path);
      }
    }
    walk(puzzle.start.cell, puzzle.start.port, []);
    return routes;
  }
  globalThis.ParkPuzzles = { puzzles, decorations, colors, directions, directionNames, ports, neighbor, complete, meetsRules, trace, routeRotations, enumerateRoutes };
})();
