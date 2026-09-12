import { Router } from "express";
import { matchVerseWithClaude } from "../claude";

export const verseRouter = Router();

verseRouter.post("/verse", async (req, res) => {
  const { situation } = req.body ?? {};

  if (typeof situation !== "string" || situation.trim().length === 0) {
    return res.status(400).json({ error: "situation is required" });
  }
  if (situation.length > 2000) {
    return res.status(400).json({ error: "situation is too long" });
  }

  const matches = await matchVerseWithClaude(situation.trim());
  res.json({ matches });
});
