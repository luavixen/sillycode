import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: "json" };

const banner = `/**\n * sillycode.js v${pkg.version}\n * made with love by lua <3\n */\n`;

export default [
  {
    input: 'lib/index.ts',
    output: [
      {
        file: 'dist/sillycode.js',
        name: 'sillycode',
        format: 'iife',
        sourcemap: false,
        banner: banner
      },
      {
        file: 'dist/sillycode.mjs',
        format: 'esm',
        sourcemap: 'inline',
        banner: banner
      }
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'lib/index.ts',
    output: {
      file: 'dist/sillycode.d.ts',
      format: 'es'
    },
    plugins: [
      dts()
    ]
  }
];
