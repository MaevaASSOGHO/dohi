import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// Domaine cible
const TARGET = "https://dohi.chat-mabelle.com";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: TARGET,
        changeOrigin: true,
        secure: true,

        // Fait croire au WAF qu’on est “même origine”
        headers: {
          Origin: TARGET,
          Referer: TARGET + "/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        },

        // Réécrit le domaine du cookie WAF pour qu’il colle à localhost
        cookieDomainRewrite: {
          "*": "localhost",
        },
        // S’assure que le chemin est / (utile si jamais le WAF force un sous-chemin)
        cookiePathRewrite: {
          "*": "/",
        },

        // Retire "Secure" des Set-Cookie (sinon Chrome ne stocke rien en HTTP local)
        configure(proxy /*, options */) {
          proxy.on("proxyRes", (proxyRes /*, req, res */) => {
            const sc = proxyRes.headers["set-cookie"];
            if (Array.isArray(sc)) {
              proxyRes.headers["set-cookie"] = sc.map((c) =>
                c.replace(/;\s*Secure/gi, "")
              );
            }
          });
        },
      },
    },
  },
});
