import replace from '@rollup/plugin-replace'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'
import util from 'node:util'

const PWD = process.env.PWD
const pkg = JSON.parse(fs.readFileSync(path.join(PWD, 'package.json'), 'utf-8'))

const tsEntry = path.resolve(PWD, 'src/index.ts')
const entry = fs.existsSync(tsEntry) ? tsEntry : tsEntry.replace('.ts', '.tsx')

const deps = [...Object.keys(Object.assign({}, pkg.peerDependencies, pkg.dependencies))]

const spy = (x) => {
  console.log(util.inspect(x, { showHidden: true, depth: null, colors: true }))
  return x
}

export default defineConfig(spy({
  plugins: [
    tsconfigPaths(),
    dts({
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/tests/**'],
      entryRoot: 'src',
      // Was defaulting to true until version 1.7
      skipDiagnostics: true,
      // Was defaulting to true until version 2.0
      copyDtsFiles: true
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: 'verbose',
    include: [`${PWD}/src/**/*.{spec,test}.{ts,tsx}`, `${PWD}/tests/**/*.{spec,test}.{ts,tsx}`],
    coverage: {
      enabled: process.env.CI === 'true',
      reporter: ['json']
    }
  },
  build: {
    // target: 'es2019',
    target: 'modules',
    // target: 'es2020',
    sourcemap: true,
    lib: {
      entry,
      name: pkg.name,
      fileName: (format) => (format === 'cjs' ? `index.cjs.js` : `index.esm.js`),
      formats: ['cjs', 'es']
    },
    rollupOptions: {
      // input: entry,
      // external: (id) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      external: (id) => deps.some((dep) => id.startsWith(dep)),
      plugins: [
        replace({
          preventAssignment: true,
          'exports.hasOwnProperty(': 'Object.prototype.hasOwnProperty.call(exports,'
        })
      ],
      output: {
        // format: 'es',
        // preserveModules: true,
        // preserveModulesRoot: 'src',
        // entryFileNames: '[name].js',
        globals: {
          graphql: 'graphql',
          '@apollo/client': '@apollo/client',
          '@apollo/client/core': '@apollo/client/core',
          '@apollo/client/link/context': '@apollo/client/link/context',
          '@apollo/client/react': '@apollo/client/react',
          '@apollo/client/link/subscriptions': '@apollo/client/link/subscriptions',
          '@apollo/client/utilities': '@apollo/client/utilities',
          'graphql-ws': 'graphql-ws',
          xstate: 'xstate',
          'js-cookie': 'Cookies',
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': '_jsx',
          '@nhost/react': '@nhost/react',
          vue: 'Vue',
          'vue-demi': 'vue-demi'
        }
      }
    }
  }
}))
