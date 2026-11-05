import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { api } from "./server/api.ts";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "doorlist-api",
      configureServer(server) {
        server.middlewares.use(api);
      },
    },
  ],
});
