import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const babelConfig = {
  babelHelpers: 'bundled',
  exclude: 'node_modules/**',
  presets: [
    ['@babel/preset-env', {
      targets: { node: '12' },
      modules: false  // Preserve ES6 modules for Rollup
    }]
  ]
};

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
      babel(babelConfig)
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
      babel(babelConfig)
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
      babel(babelConfig),
      terser()
    ]
  },
];

