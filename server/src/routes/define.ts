import { Router } from "express";
import { defineWordInContext } from "../define";

export const defineRouter = Router();

defineRouter.post("/define", async (req, res) => {
  const { word, context } = req.body ?? {};

  if (typeof word !== "string" || word.trim().length === 0) {
    return res.status(400).json({ error: "word is required" });
  }
  if (word.length > 50) {
    return res.status(400).json({ error: "word is too long" });
  }
  const contextText = typeof context === "string" ? context.slice(0, 500) : "";

  const result = await defineWordInContext(word.trim(), contextText);
  res.json(result);
});
