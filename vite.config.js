// Vite configuration: the tool that runs the app locally and builds it for Vercel.
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Make .env.local values available to the /api functions when running locally.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), localApi()],
    server: { port: 5173 },
    build: { chunkSizeWarningLimit: 1000 }, // Firebase is large; this is fine
  };
});

// On Vercel, files in /api become server functions automatically.
// This small plugin does the same on your Mac during `npm run dev`.
function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const name = req.url.split("?")[0].replace(/^\//, "");
        if (!/^[a-z-]+$/.test(name)) return next();
        try {
          const { default: handler } = await server.ssrLoadModule(`/api/${name}.js`);
          let raw = "";
          for await (const chunk of req) raw += chunk;
          req.body = raw ? JSON.parse(raw) : {};
          res.status = (code) => ((res.statusCode = code), res);
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
