import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import { TOOL_DEFINITIONS } from './tool-definitions'

const execAsync = promisify(exec)

export { TOOL_DEFINITIONS }

// Implementation functions
export const tools = {
  calculate: async ({ expr }: { expr: string }) => {
    try {
      // Very basic safety check
      if (/[a-zA-Z]/.test(expr.replace(/math|sqrt|sin|cos|tan|log|exp|PI|E/g, ''))) {
        return 'Error: Unsafe expression detected.'
      }
      return String(new Function(`return (${expr})`)())
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },

  clock: async () => {
    return new Date().toLocaleString()
  },

  memories: async ({ action, memory }: { action: string; memory?: string }) => {
    const memPath = path.join(process.cwd(), 'memories.json')
    try {
      let items = []
      try {
        const data = await fs.readFile(memPath, 'utf-8')
        items = JSON.parse(data)
      } catch (e) {}

      if (action === 'read') {
        if (items.length === 0) return 'No memories yet.'
        return items.map((m: any, i: number) => `• ${m.text}`).join('\n')
      } else if (action === 'write' && memory) {
        items.push({ text: memory, date: new Date().toISOString() })
        await fs.writeFile(memPath, JSON.stringify(items, null, 2))
        return 'Memory saved.'
      }
      return 'Action failed.'
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },

  files: async ({ action, filename, content }: { action: string; filename?: string; content?: string }) => {
    const base = process.cwd()
    try {
      if (action === 'list') {
        const files = await fs.readdir(base)
        return files.join(', ')
      }
      if (!filename) return 'Error: Filename required'
      const filePath = path.join(base, filename)
      
      if (!filePath.startsWith(base)) return 'Error: Access denied'

      if (action === 'read') {
        return await fs.readFile(filePath, 'utf-8')
      } else if (action === 'write') {
        await fs.writeFile(filePath, content || '')
        return 'File written.'
      } else if (action === 'append') {
        await fs.appendFile(filePath, content || '')
        return 'Content appended.'
      }
      return 'Unknown action.'
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },

  run_command: async ({ command }: { command: string }) => {
    try {
      const { stdout, stderr } = await execAsync(command)
      return stdout || stderr || 'Done (no output).'
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },

  search: async ({ query }: { query: string }) => {
    let browser
    try {
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 800 })
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
      
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

      // Check for CAPTCHA
      const isCaptcha = await page.$('.anomaly-modal')
      if (isCaptcha) {
        await browser.close()
        return 'Error: CAPTCHA detected. The search engine is blocking the request.'
      }

      const results = await page.evaluate(() => {
        const items: Array<{ title: string; snippet: string; url: string }> = []
        const resultElements = document.querySelectorAll('.result')
        resultElements.forEach((el, index) => {
          if (index >= 6) return
          const titleEl = el.querySelector('.result__title, .result__a')
          const snippetEl = el.querySelector('.result__snippet, .result__body')
          const urlEl = el.querySelector('.result__url, .result__a')
          const title = titleEl?.textContent?.trim() || ''
          const snippet = snippetEl?.textContent?.trim() || ''
          const url = urlEl?.getAttribute('href') || ''
          if (title || snippet) {
            items.push({ title, snippet, url })
          }
        })
        return items
      })

      await browser.close()
      
      if (results.length === 0) return 'No results found.'
      
      return results.map((r: any, i: number) => 
        `[${i+1}] ${r.title}\nSnippet: ${r.snippet}\nLink: ${r.url}`
      ).join('\n\n')

    } catch (e: any) {
      if (browser) await browser.close()
      return `Error: ${e.message}. (Make sure 'puppeteer' is installed: npm install puppeteer)`
    }
  },

  open_page: async ({ url }: { url: string }) => {
    let browser
    try {
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 800 })
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Get the rendered HTML
      const html = await page.content()
      await browser.close()
      browser = null

      // Parse with JSDOM and Readability
      const dom = new JSDOM(html, { url })
      const reader = new Readability(dom.window.document as any)
      const article = reader.parse()

      if (!article) {
        return 'Error: Could not extract readable content from the page.'
      }

      // Convert to Markdown
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      })
      
      // Rule to handle images better or ignore them if they are too many
      turndownService.addRule('images', {
        filter: 'img',
        replacement: (content, node: any) => {
          const alt = node.getAttribute('alt') || ''
          const src = node.getAttribute('src') || ''
          return src ? `![${alt}](${src})` : ''
        }
      })

      const markdown = turndownService.turndown(article.content || '')

      return `## ${article.title}\n\n${markdown}`.slice(0, 15000) // generous limit for LLM context

    } catch (e: any) {
      if (browser) await browser.close()
      return `Error: ${e.message}`
    }
  }
}
