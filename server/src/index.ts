import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verseRouter } from "./routes/verse";
import { conversationRouter } from "./routes/conversation";
import { getModelProvider, warnIfMisconfigured } from "./modelProvider";

dotenv.config();

console.log(`AI provider: ${getModelProvider()}`);
warnIfMisconfigured();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", verseRouter);
app.use("/api", conversationRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Soul Not Solo backend listening on port ${PORT}`);
});
