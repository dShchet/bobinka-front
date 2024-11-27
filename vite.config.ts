import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, "./");

  return defineConfig({
    envDir: "./",
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: parseInt(env.VITE_PORT) ?? 3333,
    },
    preview: {
      host: "0.0.0.0",
      port: parseInt(env.VITE_PORT) ?? 3333,
    },
    plugins: [vue()],
  });
};
