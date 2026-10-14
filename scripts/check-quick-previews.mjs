// Run with node --import tsx scripts/check-quick-previews.mjs. Pure projections only; no database access.
import assert from "node:assert/strict";
import Module from "node:module";

const load = Module._load;
Module._load = function (name, parent, main) {
  return name === "server-only" ? {} : load.call(this, name, parent, main);
};
process.env.COUNTRIVO_GAME_SECRET = "isolated-preview-check-secret-not-production";
const { higherRemote, flagRemote, statRemote, higherView, flagView, statView } = await import("../src/server/quick-sessions.ts");
const games = [
  { module: higherRemote, project: higherView, action: { t: "guess", c: "higher" } },
  { module: flagRemote, project: flagView, action: { t: "answer", i: 0 } },
  { module: statRemote, project: statView, action: { t: "lock", i: 0 } },
];
let assertions = 0, previews = 0;
function check(label, actual, expected) { assert.deepEqual(actual, expected, label); assertions++; }
for (const { module, project, action } of games) {
  for (const mode of ["daily", "practice"]) {
    for (let seed = 1; seed <= 8; seed++) {
      let state = module.create(seed, mode, "2026-10-13");
      check("Initial challenge must not preview future rounds", project(state, mode, "2026-10-13").nextView, undefined);
      let rounds = 0;
      while (!module.done(state) && rounds++ < 120) {
        state = module.reduce(state, action);
        const before = JSON.stringify(state);
        const reveal = project(state, mode, "2026-10-13");
        const next = module.reduce(state, { t: "next" });
        check("Projection cannot mutate engine state", JSON.stringify(state), before);
        if (module.done(next)) {
          check("Final reveal must not preload a result", reveal.nextView, undefined);
          check("Finished result must not preload another challenge", project(next, mode, "2026-10-13").nextView, undefined);
        } else {
          const preview = reveal.nextView;
          assert(preview, `${module.slug} must preview its next public challenge`); assertions++; previews++;
          check("Preview matches the exact public next-round projection", preview, project(next, mode, "2026-10-13"));
          check("Preview exposes only a playing stage", preview.phase, "playing");
          check("Preview cannot recursively include later rounds", preview.nextView, undefined);
          check("Preview does not contain a share result", preview.shareText, "");
          check("Preview advances only one public round", preview.round, reveal.round + 1);
          if (preview.kind === "higher-or-lower") {
            check("Unknown country value remains hidden", preview.right.value, null);
            check("Next call remains hidden", [preview.chosen, preview.correct, preview.comparison], [null, null, null]);
          } else if (preview.kind === "flag-quiz") {
            check("Correct flag option remains hidden", [preview.picked, preview.correctIndex, preview.fact, preview.source], [null, null, null, null]);
            assert.match(preview.flagSrc, /^\/quiz-flags\/[a-f0-9]{40}\.svg$/); assertions++;
          } else {
            check("Stat answer, fit, points and context remain hidden", [preview.actualValue, preview.guessValue, preview.points, preview.context, preview.gap], [null, null, null, null, null]);
          }
          check("Preview history contains only answered rounds", preview.history.length <= reveal.round + 1, true);
        }
        state = next;
      }
    }
  }
}
console.log(`check-quick-previews: ${assertions} assertions passed across ${previews} next public challenges; answers stay hidden; no database calls`);
