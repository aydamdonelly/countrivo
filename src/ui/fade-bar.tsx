/**
 * The 40 px fade above the tab bar (blueprint 3.27): fixed, transparent to paper, no
 * pointer events; the last list on a screen dissolves into it. Hidden with the tab bar
 * at >= 1024. Layouts render it right before <TabBar />.
 */
export function FadeBar() {
  return <div className="fadebar" aria-hidden="true" />;
}
