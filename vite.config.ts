import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react'
import path from 'path'
import atImport from 'postcss-import'
import { readFileSync } from 'node:fs'

const projectID = process.env.VITE_APP_PROJECT_ID || ''

const { resolve } = path

let fileStr = `@import "@/styles/mixins/index.scss";@import "@/styles/variables.scss";@import "@/sites/assets/styles/variables.scss";\n`
if (projectID) {
  fileStr = `@import "@/styles/mixins/index.scss";@import '@/styles/variables-${projectID}.scss';\n@import "@/sites/assets/styles/variables.scss";\n`
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const mdx = await import('@mdx-js/rollup')
  const remarkGfm = await import('remark-gfm')
  const remarkDirective = await import('remark-directive')
  return {
    server: {
      host: '0.0.0.0',
    },
    base: '/react/',
    define: {
      __PROJECTID__: JSON.stringify(`${projectID}` ? `-${projectID}` : ''),
    },
    resolve: {
      alias: [
        { find: '@', replacement: resolve(__dirname, './src') },
        {
          find: '@nutui/nutui-react',
          replacement: resolve(__dirname, './src/packages/nutui.react.ts'),
        },
        {
          find: '@nutui/nutui-react-taro',
          replacement: resolve(__dirname, './src/packages/nutui.react.taro.ts'),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // example : additionalData: `@import "./src/design/styles/variables";`
          // dont need include file extend .scss
          additionalData: fileStr,
        },
        postcss: {
          plugins: [atImport({ path: path.join(__dirname, 'src`') })],
        },
      },
    },
    plugins: [
      {
        enforce: 'pre',
        ...mdx.default({
          providerImportSource: '@mdx-js/react',
          mdExtensions: [],
          mdxExtensions: ['.md'],
          remarkPlugins: [remarkGfm.default, remarkDirective.default],
        }),
      },
      {
        name: 'test',
        apply: 'serve',
        async load(id) {
          if (id.endsWith('.scss')) {
            // 移除 @import 语句
            const filePath = resolve(process.cwd(), id)
            const scssCode = await readFileSync(filePath, 'utf-8')
            const modifiedCode = scssCode.replace(
              /@import\s+['"](\.{2}?\/)[^'"]+['"];/g,
              ''
            )
            return modifiedCode
          }
        },
      },

      reactRefresh(),
    ],
  }
})
