import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: "/",
    root: ".", // project root
    publicDir: "public", // static assets
    build: {
        outDir: "dist", // default output folder
        sourcemap: true, // optional, keep maps for debugging
    },
    plugins: [tailwindcss()],
});
