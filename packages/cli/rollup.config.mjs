import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    exports: 'named'
  },
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    babel({ babelHelpers: 'bundled' })
  ],
  external: ['fs', 'path', '@lean-format/core']
};


