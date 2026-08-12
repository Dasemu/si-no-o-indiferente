import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { storiesRouter } from "./routes/stories.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", storiesRouter);

app.listen(config.port, () => {
  console.log(`API de historias escuchando en http://localhost:${config.port}`);
});
