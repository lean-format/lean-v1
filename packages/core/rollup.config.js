import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default [
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm'
    },
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // UMD build (browser)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/lean-format.min.js',
      format: 'umd',
      name: 'LEAN',
      exports: 'named'
    },
    plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' }),
      terser()
    ]
  },
];
