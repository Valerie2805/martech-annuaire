import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

function govApiProxyPlugin() {
  function apply(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      try {
        const url = req.url || ""
        if (!url.startsWith("/api/recherche-entreprises/")) return next()

        const u = new URL(url, "http://localhost")
        const upstreamPath = u.pathname.replace(/^\/api\/recherche-entreprises/, "")
        const upstreamUrl = `https://recherche-entreprises.api.gouv.fr${upstreamPath}${u.search}`

        const upstreamRes = await fetch(upstreamUrl, {
          headers: {
            Accept: req.headers.accept || "application/json",
            "User-Agent": "martech-annuaire/1.0",
          },
        })

        res.statusCode = upstreamRes.status
        res.setHeader("content-type", upstreamRes.headers.get("content-type") || "application/json")
        res.setHeader("cache-control", "no-store")
        const body = Buffer.from(await upstreamRes.arrayBuffer())
        res.end(body)
      } catch {
        res.statusCode = 502
        res.setHeader("content-type", "application/json")
        res.end(JSON.stringify({ error: "proxy_error" }))
      }
    })
  }

  return {
    name: "gov-api-proxy",
    configureServer(server: any) {
      apply(server)
    },
    configurePreviewServer(server: any) {
      apply(server)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    govApiProxyPlugin(),
    tsconfigPaths()
  ],
})
