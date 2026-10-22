/* 通常進行専用。DEVプレビューはこのデータに含めない。 */
(() => {
  "use strict";
  const P = globalThis.ParkPuzzles;
  const KEY = "remember-my-park.progress.v1";
  const ids = Object.keys(P.puzzles);
  const newRound = p => ({ values: p.choices?.map(() => ""), rotations: p.initial && [...p.initial], hint: 0, solved: false, cleared: false, result: null });
  const fresh = () => ({
    version: 1,
    facilities: Object.fromEntries(ids.map(id => [id, { index: 0, started: false, rounds: P.puzzles[id].map(newRound) }])),
    restored: [], lightCount: 0, endingReached: false
  });
  function restoredFrom(facilities) {
    return ids.filter(id => facilities[id].rounds.every(r => r.cleared));
  }
  function validate(data) {
    const invalid = () => { throw new Error("Invalid park save"); };
    const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
    if (!object(data) || data.version !== 1 || !object(data.facilities) || typeof data.endingReached !== "boolean") invalid();
    const result = fresh();
    for (const id of ids) {
      const s = data.facilities[id];
      if (!object(s) || ![0, 1].includes(s.index) || typeof s.started !== "boolean" || !Array.isArray(s.rounds) || s.rounds.length !== 2) invalid();
      result.facilities[id] = { index: s.index, started: s.started, rounds: s.rounds.map((r, i) => {
        const p = P.puzzles[id][i];
        if (!object(r) || typeof r.solved !== "boolean" || typeof r.cleared !== "boolean" || !Number.isInteger(r.hint) || r.hint < 0 || r.hint > 3 || (r.solved && !r.cleared)) invalid();
        const round = { hint: r.hint, solved: r.solved, cleared: r.cleared, result: null };
        if (p.kind === "train") {
          if (!Array.isArray(r.rotations) || r.rotations.length !== p.types.length || !r.rotations.every(v => Number.isInteger(v) && v >= 0 && v <= 3)) invalid();
          round.rotations = [...r.rotations];
          if (r.solved && !P.trace(p, r.rotations).ok) invalid();
        } else {
          if (!Array.isArray(r.values) || r.values.length !== p.choices.length || !r.values.every(v => v === "" || p.choices.includes(v))) invalid();
          const assigned = r.values.filter(Boolean);
          if (new Set(assigned).size !== assigned.length || (r.solved && !P.meetsRules(p, r.values))) invalid();
          round.values = [...r.values];
        }
        return round;
      }) };
      const rounds = result.facilities[id].rounds;
      if ((s.index === 1 || rounds[1].cleared) && !rounds[0].cleared) invalid();
      if (!s.started && (s.index !== 0 || rounds.some((r, i) => r.cleared || r.solved || r.hint > 0 || (r.values ? r.values.some(Boolean) : r.rotations.some((v, j) => v !== P.puzzles[id][i].initial[j]))))) invalid();
    }
    const restored = restoredFrom(result.facilities);
    if (!Array.isArray(data.restored) || data.restored.length !== restored.length || new Set(data.restored).size !== restored.length || data.restored.some(id => !restored.includes(id)) || data.lightCount !== restored.length || (data.endingReached && restored.length !== ids.length)) invalid();
    result.restored = restored;
    result.lightCount = restored.length;
    result.endingReached = data.endingReached;
    return result;
  }
  function load(storage) {
    let raw;
    try { raw = (storage || globalThis.localStorage).getItem(KEY); }
    catch { return { state: fresh(), status: "unavailable" }; }
    if (raw === null) return { state: fresh(), status: "empty" };
    try {
      if (raw.length > 100000) throw new Error("Oversized save");
      return { state: validate(JSON.parse(raw)), status: "loaded" };
    } catch { return { state: fresh(), status: "corrupt" }; }
  }
  function write(state, storage) {
    try {
      (storage || globalThis.localStorage).setItem(KEY, JSON.stringify(validate(state)));
      return true;
    } catch { return false; }
  }
  globalThis.ParkSave = { KEY, fresh, newRound, restoredFrom, validate, load, write };
})();
