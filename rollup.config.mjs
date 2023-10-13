import vue from 'rollup-plugin-vue'
import buble from '@rollup/plugin-buble'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import css from "rollup-plugin-import-css";

export default [
  {
    input: 'src/components/Icon.vue',
    output: {
      file: 'src/components/Icon.js',
      format: 'esm'
    },
    external: ['vue'],
    plugins: [
      resolve(),
      commonjs(),
      vue({
        template: {
          optimizeSSR: true
        },
        compileTemplate: true,
        css: true
      }),
      css(),
      terser()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/vue-awesome.js',
      name: 'VueAwesome',
      format: 'umd',
      globals: {
        vue: 'Vue'
      }
    },
    external: ['vue'],
    plugins: [
      resolve(),
      vue({
        compileTemplate: true,
        css: true
      }),
      css(),
      terser()
    ]
  }
]
