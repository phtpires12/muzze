import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["muzze-logo.png"],
      manifest: {
        name: "Muzze - Organize sua Criatividade",
        short_name: "Muzze",
        description: "Organize sua Criatividade e não pare de criar, nunca mais.",
        theme_color: "#FF9A5F",
        background_color: "#0A0A0A",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/muzze-favicon.png"],
        importScripts: ["/firebase-messaging-sw.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
        // Force update strategy
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Navigation preload for faster page loads
        navigationPreload: true,
      runtimeCaching: [
          // Navigations (SPA routes) - buscar do servidor primeiro para evitar app shell obsoleto
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 25,
                maxAgeSeconds: 60 * 10, // 10 minutos
              },
            },
          },
          // JS/CSS files - buscar do servidor primeiro para evitar cache obsoleto
          {
            urlPattern: /\.(js|css)$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2, // 2 horas
              },
              networkTimeoutSeconds: 3,
            }
          },
          // HTML files - sempre buscar do servidor primeiro
          {
            urlPattern: /\.html$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hora
              },
              networkTimeoutSeconds: 3,
            }
          },
          // Supabase API
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hora (reduzido de 24h)
              },
              networkTimeoutSeconds: 5,
            }
          },
          // Edge functions - nunca cachear
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: "NetworkOnly",
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
