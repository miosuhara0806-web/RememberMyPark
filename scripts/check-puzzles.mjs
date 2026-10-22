import assert from 'node:assert/strict';
import '../js/puzzles.js';
const P = globalThis.ParkPuzzles;
function permutations(items) {
  return items.length ? items.flatMap((v, i) => permutations(items.filter((_, j) => i !== j)).map(t => [v, ...t])) : [[]];
}
for (const [facility, questions] of Object.entries(P.puzzles)) {
  for (const [index, p] of questions.entries()) {
    assert.equal(p.hints.length, 3);
    assert.equal(p.hintFacts.length, 3);
    if (p.kind !== 'train') {
      const all = permutations(p.choices);
      assert.equal(all.length, p.choices.length === 4 ? 24 : p.choices.length === 5 ? 120 : 720);
      const valid = all.filter(values => P.meetsRules(p, values));
      assert.deepEqual(valid, [p.solution], '全候補中の正解は指定の1通り');
      assert.equal(P.meetsRules(p, Array(p.choices.length).fill(p.choices[0])), false, '重複は不正解');
      assert.equal(P.meetsRules(p, p.solution.slice(1)), false, '未完成は不正解');
      assert.equal(P.complete(p, p.solution.map(() => '')), false);
      p.hintFacts.forEach(f => {
        if ('slot' in f) assert.equal(p.solution[f.slot], f.value, '配置ヒントと正解を照合');
        if ('rule' in f) assert.ok(p.rules[f.rule], '参照する手掛かりが存在');
      });
      console.log(`${facility} Q${index + 1}: ${all.length} permutations, unique solution, incorrect/incomplete/duplicates and 3 hints OK`);
    } else {
      assert.equal(p.types.length, p.size ** 2);
      assert.equal(p.initial.length, p.types.length);
      const solution = P.routeRotations(p);
      assert.equal(P.trace(p, p.initial).ok, false, '開始時に完成していない');
      assert.deepEqual(P.enumerateRoutes(p), [p.route], '全経路探索で駅を通るルートは1本');
      assert.deepEqual(P.trace(p, solution).path, p.route);
      assert.equal(P.trace(p, solution).ok, true);
      assert.ok(p.route.length < p.size ** 2, '全マス通過を強制していない');
      p.hintFacts.forEach(f => assert.deepEqual([...P.ports(p.types[f.cell], solution[f.cell])].sort(), [...f.ports].sort(), '線路ヒントの方向を照合'));
      for (const path of P.enumerateRoutes(p, false)) {
        const result = P.trace(p, P.routeRotations(p, path));
        assert.equal(result.ok, p.stations.every(s => path.includes(s.cell)), '駅を飛ばす抜け道を拒否');
      }
      for (const cell of p.route) {
        const broken = [...solution];
        broken[cell] = (broken[cell] + 1) % 4;
        assert.equal(P.trace(p, broken).ok, false, 'ルート中の向きを変えると不正解');
      }
      for (let i = 0; i < p.types.length; i++) {
        if (p.route.includes(i)) continue;
        for (let rotation = 0; rotation < 4; rotation++) {
          const changed = [...solution];
          changed[i] = rotation;
          assert.equal(P.trace(p, changed).ok, true, '未通過タイルの向きは自由');
        }
      }
      if (p.size === 3) {
        let total = 0, valid = 0;
        function visit(rotations) {
          const i = rotations.length;
          if (i === p.types.length) {
            total++;
            const result = P.trace(p, rotations);
            if (result.ok) { valid++; assert.deepEqual(result.path, p.route); }
            return;
          }
          for (let r = 0; r < (p.types[i] === 'I' ? 2 : 4); r++) visit([...rotations, r]);
        }
        visit([]);
        assert.equal(total, 32768);
        assert.equal(valid, 16); // 使わない2カーブの向きだけ自由。
        console.log(`${facility} Q${index + 1}: all ${total} distinct boards, ${valid} valid boards on one 7-cell route; 3 hints OK`);
      } else {
        assert.equal(P.enumerateRoutes(p, false).length, 2);
        const shortcut = P.enumerateRoutes(p, false).find(path => path.length < p.route.length);
        const rejected = P.trace(p, P.routeRotations(p, shortcut));
        assert.equal(rejected.reason, 'stations');
        assert.equal(rejected.missing.length, 2);
        console.log(`${facility} Q${index + 1}: exhaustive route search, one 13-cell valid route; 9-cell shortcut rejected (both stations missing); 3 hints OK`);
      }
    }
  }
}
// 曲線は進入口と接続していなければ進めず、直線から直角に曲がれない。
assert.equal(P.trace({ size: 2, types: ['C','I','I','I'], start: { cell: 0, port: 3 }, goal: { cell: 3, port: 1 }, stations: [] }, [0,0,0,0]).reason, 'broken');
const loop = { size: 2, types: ['C','C','C','C'], start: { cell: 0, port: 1 }, goal: { cell: 3, port: 2 }, stations: [] };
assert.equal(P.trace(loop, [1,2,0,3]).reason, 'loop', '閉路も有限時間で停止');
console.log('All six puzzles passed.');
