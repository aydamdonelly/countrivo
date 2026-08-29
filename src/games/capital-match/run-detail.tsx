/*
 * The run page rows for a shared Capital Match run (blueprint 7.7). The saved resultJson is
 * the frozen submission shape { score, total, answers }: option indices, not countries, and
 * the stored seed is derived from the slug rather than the board's daily seed, so the ten
 * questions cannot be named honestly here. GenericDetail prints the two numbers it does carry.
 */
export { GenericDetail as RunDetail } from "@/games/_shared/generic-detail";
