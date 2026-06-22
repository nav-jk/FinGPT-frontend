import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Uncomment to proxy API calls during dev (avoids CORS):
    // proxy: {
    //   "/users": "http://localhost:3000",
    //   "/conversations": "http://localhost:3000",
    //   "/chat": "http://localhost:3000",
    // },
  },
});