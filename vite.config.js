// Vite configuration: the tool that runs the app locally and builds it for Vercel.
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Make .env.local values available to the /api functions when running locally.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), localApi(), aphorismReview()],
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

// Admin → Aphorisms: approve, edit or reject AI-drafted lines. Only exists while
// `npm run dev` is running on your Mac (it edits the files in /data), never on the live site.
function aphorismReview() {
  return {
    name: "aphorism-review",
    configureServer(server) {
      server.middlewares.use("/dev-api/aphorisms", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
        if (!local) return (res.statusCode = 403), res.end(JSON.stringify({ error: "Only on this computer." }));
        try {
          const review = await server.ssrLoadModule("/scripts/aphorism-review.js");
          if (req.method === "POST") {
            let raw = "";
            for await (const chunk of req) raw += chunk;
            const { action, id, text } = JSON.parse(raw || "{}");
            if (action === "approve") review.approveDraft(id);
            else if (action === "reject") review.rejectDraft(id);
            else if (action === "edit") review.editDraft(id, text);
            else throw new Error("Unknown action.");
          }
          res.end(JSON.stringify(review.reviewStatus()));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
