import typescript from '@rollup/plugin-typescript';

import sillycode from './package.json' with { type: "json" };

export default {
  input: 'lib/index.ts',
  output: {
    file: 'dist/sillycode.js',
    name: 'sillycode',
    format: 'iife',
    sourcemap: false,
    banner: `/**\n * sillycode.js v${sillycode.version}\n * made with love by lua <3\n */`
  },
  plugins: [typescript()]
};
