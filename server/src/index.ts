import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verseRouter } from "./routes/verse";
import { conversationRouter } from "./routes/conversation";

dotenv.config();

const modelProvider = process.env.MODEL_PROVIDER === "nim" ? "nim" : "anthropic";
console.log(`Verse-matching provider: ${modelProvider}`);

if (modelProvider === "nim" && !process.env.NVIDIA_NIM_API_KEY) {
  console.warn(
    "MODEL_PROVIDER=nim but NVIDIA_NIM_API_KEY is not set — verse matching will always fall back to the built-in keyword list."
  );
} else if (modelProvider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "ANTHROPIC_API_KEY is not set — verse matching will always fall back to the built-in keyword list. Copy .env.example to .env and add your key."
  );
}

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
