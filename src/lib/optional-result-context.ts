export const RESULT_CONTEXT_BUDGET_MS = 900;

export interface ResultContextBudget {
  active(): boolean;
}

/** Optional reads may finish warming their public cache, but cannot hold a saved result. */
export function optionalResultContext<T>(work: (budget: ResultContextBudget) => Promise<T>, fallback: T, budgetMs = RESULT_CONTEXT_BUDGET_MS): Promise<T> {
  const expires = performance.now() + budgetMs;
  let settled = false;
  let timer: ReturnType<typeof setTimeout>;
  return new Promise(resolve => {
    const finish = (value: T) => {
      if (settled) return;
      const timely = performance.now() < expires;
      settled = true;
      clearTimeout(timer);
      resolve(timely ? value : fallback);
    };
    timer = setTimeout(() => finish(fallback), budgetMs);
    const budget = { active: () => !settled && performance.now() < expires };
    Promise.resolve().then(() => work(budget)).then(finish, () => finish(fallback));
  });
}
