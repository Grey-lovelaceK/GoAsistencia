import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        name: "GOTEST Marcación",
        short_name: "MarcaGO",
        description: "Sistema de control de asistencia con geofence",
        start_url: "/punch",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0c1e3c",
        theme_color: "#2989d8",
        lang: "es-CL",
        categories: ["productivity", "business"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
        ],
        shortcuts: [
          {
            name: "Marcar Entrada",
            url: "/punch?action=entrada",
            icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.gotest\.app\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
