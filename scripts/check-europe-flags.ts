import assert from 'node:assert/strict';
import { countries, sovereignIso3 } from '../src/lib/data/public';
import { createEuropeFlagQuiz, createFlagQuiz, answerQuestion, MAX_POINTS, pointsAt } from '../src/lib/game-logic/flag-quiz/engine';
import { mulberry32 } from '../src/lib/seeded-random';

const european = new Set(countries.filter(country => country.continent === 'Europe' && sovereignIso3.includes(country.iso3)).map(country => country.iso3));
let boards = 0;
for (let sample = 0; sample < 365; sample += 1) {
  const dateKey = new Date(Date.UTC(2026, 0, 1 + sample)).toISOString().slice(0, 10);
  const daily = createFlagQuiz(mulberry32(sample + 42), { mode: 'daily', dateKey });
  const excluded = daily.questions.map(question => question.country.iso3);
  const seed = sample * 7151;
  let regional = createEuropeFlagQuiz(mulberry32(seed), excluded);
  assert.deepEqual(regional, createEuropeFlagQuiz(mulberry32(seed), excluded), 'A resumed seed must deal the identical regional board');
  assert.equal(regional.questions.length, 10);
  assert.equal(new Set(regional.questions.map(question => question.country.iso3)).size, 10, 'Answers never repeat within a round');
  for (const [index, question] of regional.questions.entries()) {
    assert(european.has(question.country.iso3));
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map(country => country.iso3)).size, 4);
    assert(question.options.every(country => european.has(country.iso3) && !excluded.includes(country.iso3)), 'Daily answer flags and non-European options stay out of regional practice');
    assert.equal(question.options[question.correctIndex].iso3, question.country.iso3);
    assert.equal(question.points, pointsAt(index));
    regional = answerQuestion(regional, question.correctIndex);
  }
  assert.equal(regional.phase, 'results');
  assert.equal(regional.score, MAX_POINTS);
  boards += 1;
}
assert.throws(() => createEuropeFlagQuiz(mulberry32(42), [...european]), /Not enough/);
console.log(`Europe flags: ${boards} deterministic boards checked; 3,650 questions stay in the sovereign European pool and exclude daily answers. Perfect scores remain ${MAX_POINTS}.`);
