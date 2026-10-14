import { fileURLToPath } from 'node:url';

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [fileURLToPath(new URL('./scripts/postcss-legacy.cjs', import.meta.url))]: {},
  },
};

export default config;
