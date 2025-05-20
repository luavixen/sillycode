import typescript from '@rollup/plugin-typescript';

export default {
  input: 'lib/index.ts',
  output: {
    file: 'dist/sillycode.js',
    format: 'iife',
    name: 'sillycode',
    sourcemap: false
  },
  plugins: [typescript()]
};
