import typescript from '@rollup/plugin-typescript';

import pkg from './package.json' with { type: "json" };

export default {
  input: 'lib/index.ts',
  output: {
    file: 'dist/sillycode.js',
    name: 'sillycode',
    format: 'iife',
    sourcemap: false,
    banner: `/**\n * sillycode.js v${pkg.version}\n * made with love by lua <3\n */\n`
  },
  plugins: [typescript()]
};
