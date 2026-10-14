const LEGACY = 'not (color: color-mix(in srgb, red, blue))';
const LAYERS = ['properties', 'theme', 'base', 'components', 'utilities'];
const RESERVED_ID = '__cv_layer';

function cleanSelector(tokens) {
  const cleaned = [];
  for (const token of tokens) {
    if (token.type !== 'pseudo-class') { cleaned.push(token); continue; }
    if (['has', 'popover-open', 'open'].includes(token.kind)) return null;
    if (token.kind === 'focus-visible') { cleaned.push({...token, kind: 'focus'}); continue; }
    if (token.selectors) {
      const selectors = token.selectors.map(cleanSelector).filter(Boolean);
      if (!selectors.length) return null;
      cleaned.push({...token, selectors});
    } else cleaned.push(token);
  }
  return cleaned;
}

function ids(tokens) {
  return tokens.reduce((count, token) => count + (token.type === 'id' ? 1 : 0) +
    (token.selectors ? Math.max(0, ...token.selectors.map(ids)) : 0), 0);
}

function selectorWithPriority(selector, rank, postcss, transform) {
  const code = transform({
    filename: 'legacy-selector.css', code: Buffer.from(`${selector}{color:red}`),
    visitor: {Rule: {style(rule) {
      rule.value.selectors = rule.value.selectors.flatMap(tokens => {
        const cleaned = cleanSelector(tokens);
        if (!cleaned) return [];
        // Two IDs per layer outweigh this app's original selectors without changing matches.
        if (ids(cleaned) > 1) throw new Error(`Legacy layer specificity needs updating: ${selector}`);
        if (cleaned.some(token => token.type === 'id' && token.name === RESERVED_ID)) throw new Error('Reserved legacy CSS ID');
        const priority = Array.from({length: rank * 2}, () => ({type: 'pseudo-class', kind: 'not', selectors: [[{type: 'id', name: RESERVED_ID}]]}));
        const pseudoElement = cleaned.findIndex(token => token.type === 'pseudo-element');
        const at = pseudoElement < 0 ? cleaned.length : pseudoElement;
        return [[...cleaned.slice(0, at), ...priority, ...cleaned.slice(at)]];
      });
      return rule;
    }}},
  }).code.toString();
  return postcss.parse(code).nodes.filter(node => node.type === 'rule').map(rule => rule.selector).join(',');
}

function layerOf(rule) {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type !== 'atrule') continue;
    if (parent.name.endsWith('keyframes')) return null;
    if (parent.name === 'layer') {
      const rank = LAYERS.indexOf(parent.params);
      if (rank < 0) throw new Error(`Unknown legacy CSS layer: ${parent.params}`);
      return rank;
    }
  }
  return LAYERS.length;
}

module.exports = () => ({
  postcssPlugin: 'countrivo-legacy-css',
  async OnceExit(root, {postcss}) {
    let layered = false;
    root.walkAtRules('layer', rule => { if (rule.nodes) layered = true; });
    if (!layered) return;
    const {transform} = await import('lightningcss');
    const legacy = root.clone();
    // Minifiers discard duplicate viewport declarations; the isolated copy must use vh itself.
    legacy.walkDecls(declaration => { declaration.value = declaration.value.replace(/\b(\d*(?:\.\d+)?)[sd]vh\b/g, '$1vh'); });
    legacy.walkAtRules('property', rule => rule.remove());
    legacy.walkAtRules('supports', rule => {
      // Keep the already-generated RGB colours, not their modern overrides.
      if (/color:(?:color-mix|lab)\(/.test(rule.params.replace(/\s/g, ''))) rule.remove();
      else if (rule.params.includes('-webkit-hyphens') && rule.params.includes('margin-trim')) rule.replaceWith(...rule.nodes);
    });
    legacy.walkRules(rule => {
      const layer = layerOf(rule);
      if (layer === null) return;
      const normal = rule.nodes.filter(node => node.type === 'decl' && !node.important);
      const important = rule.nodes.filter(node => node.type === 'decl' && node.important);
      const copies = [];
      for (const [declarations, rank] of [[normal, layer], [important, LAYERS.length - layer]]) {
        if (!declarations.length) continue;
        const selector = selectorWithPriority(rule.selector, rank, postcss, transform);
        if (selector) copies.push(rule.clone({selector, nodes: declarations.map(node => node.clone())}));
      }
      rule.replaceWith(...copies);
    });
    legacy.walkAtRules('layer', rule => { if (rule.nodes) rule.replaceWith(...rule.nodes); else rule.remove(); });
    const lowered = transform({
      filename: root.source?.input.file ?? 'legacy.css',
      code: Buffer.from(legacy.toString()), minify: true,
      targets: {safari: 15 << 16, ios_saf: 15 << 16},
    }).code.toString();
    root.append(postcss.atRule({name: 'supports', params: LEGACY, nodes: postcss.parse(lowered).nodes}));
  },
});
module.exports.postcss = true;
