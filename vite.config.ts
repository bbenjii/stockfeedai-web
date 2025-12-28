import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from 'node:url'


export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            tsconfigPaths(),
            tailwindcss(),
            reactRouter(),
        ],
        define: {
            VITE_API_BASE_URL: JSON.stringify(env.VITE_API_BASE_URL),
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./app', import.meta.url))
            }
        }
    }
});