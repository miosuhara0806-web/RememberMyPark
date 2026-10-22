import assert from 'node:assert/strict';
import '../js/puzzles.js';
import '../js/save.js';
const S = globalThis.ParkSave, P = globalThis.ParkPuzzles;
const plain = v => JSON.parse(JSON.stringify(v));
const store = new Map([['unrelated', 'keep']]);
const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
assert.equal(S.load(storage).status, 'empty');
assert.equal(S.load(storage).state.lightCount, 0);
const state = S.fresh();
state.facilities.carousel.started = true;
state.facilities.carousel.rounds[0].values = ['bell', '', 'moon', ''];
state.facilities.carousel.rounds[0].hint = 2;
state.facilities['mini-train'].started = true;
state.facilities['mini-train'].rounds[0].rotations[0] = 1;
state.facilities['mini-train'].rounds[0].hint = 1;
assert.equal(S.write(state, storage), true);
assert.deepEqual(plain(S.load(storage).state), plain(state), '途中の配置・回転・ヒントを復元');
function clearFacility(id) {
  const s = state.facilities[id];
  s.started = true;
  s.index = 1;
  s.rounds.forEach((r, i) => {
    const p = P.puzzles[id][i];
    if (p.kind === 'train') r.rotations = P.routeRotations(p);
    else r.values = [...p.solution];
    r.cleared = r.solved = true;
  });
  state.restored = S.restoredFrom(state.facilities);
  state.lightCount = state.restored.length;
}
clearFacility('carousel');
assert.equal(S.write(state, storage), true);
assert.equal(S.load(storage).state.lightCount, 1, '1施設の復活を保存');
clearFacility('ferris-wheel');
clearFacility('mini-train');
state.endingReached = true;
assert.equal(S.write(state, storage), true);
assert.deepEqual(plain(S.load(storage).state), plain(state), '全6問クリア・全復活・エンディングを復元');
// 個別問題を遊び直しても、解放済みの問題と施設復活は維持。
state.facilities.carousel.rounds[0] = { ...S.newRound(P.puzzles.carousel[0]), cleared: true };
assert.equal(S.write(state, storage), true);
assert.equal(S.load(storage).state.lightCount, 3);
const corruptions = [
  '{broken', 'null', '{}', JSON.stringify({ ...S.fresh(), version: 999 }),
  JSON.stringify({ ...S.fresh(), lightCount: 3 }),
  JSON.stringify({ ...S.fresh(), restored: ['carousel'] }),
  JSON.stringify({ ...S.fresh(), endingReached: true }),
  'x'.repeat(100001)
];
const badState = mutation => { const s = plain(S.fresh()); mutation(s); corruptions.push(JSON.stringify(s)); };
badState(s => s.facilities.carousel.rounds[0].values = ['star', 'star', '', '']);
badState(s => s.facilities.carousel.rounds[0].values[0] = '<script>');
badState(s => s.facilities.carousel.rounds[0].values = []);
badState(s => s.facilities.carousel.rounds[0].hint = 4);
badState(s => s.facilities.carousel.rounds[0].cleared = 'true');
badState(s => s.facilities.carousel.rounds[0].solved = true);
badState(s => { s.facilities.carousel.rounds[0].solved = s.facilities.carousel.rounds[0].cleared = s.facilities.carousel.started = true; });
badState(s => s.facilities.carousel.rounds[1].cleared = true);
badState(s => s.facilities.carousel.index = 1);
badState(s => s.facilities['mini-train'].rounds[0].rotations[0] = 4);
badState(s => s.facilities['mini-train'].rounds[0].rotations[0] = -1);
badState(s => { s.facilities['mini-train'].started = true; s.facilities['mini-train'].rounds[0].rotations.pop(); });
badState(s => s.facilities['mini-train'].rounds[0].rotations[0] = 1);
badState(s => s.facilities.carousel.started = 1);
for (const raw of corruptions) {
  store.set(S.KEY, raw);
  const loaded = S.load(storage);
  assert.equal(loaded.status, 'corrupt');
  assert.deepEqual(plain(loaded.state), plain(S.fresh()), '破損データは安全に初期化');
}
const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
assert.equal(S.load(blocked).status, 'unavailable');
assert.equal(S.write(state, blocked), false, '保存禁止・容量不足で例外を外へ出さない');
assert.equal(S.write(S.fresh(), storage), true, '確認後の初期化');
assert.equal(S.load(storage).state.lightCount, 0);
assert.equal(S.load(storage).state.endingReached, false);
assert.equal(store.get('unrelated'), 'keep', '他のlocalStorageキーは変更しない');
console.log(`Save validation passed: partial progress, six clears, ending, replay, ${corruptions.length} corrupt cases, blocked storage and reset.`);
