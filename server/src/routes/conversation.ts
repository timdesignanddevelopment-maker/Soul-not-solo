import { Router } from "express";
import { continueConversation, type ConversationTurn } from "../conversation";

export const conversationRouter = Router();

conversationRouter.post("/conversation", async (req, res) => {
  const { situation, history, message } = req.body ?? {};

  if (typeof situation !== "string" || situation.trim().length === 0) {
    return res.status(400).json({ error: "situation is required" });
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "message is too long" });
  }
  if (!Array.isArray(history) || history.length > 20) {
    return res.status(400).json({ error: "invalid history" });
  }
  const validHistory: ConversationTurn[] = history.filter(
    (turn): turn is ConversationTurn =>
      turn &&
      (turn.role === "user" || turn.role === "assistant") &&
      typeof turn.content === "string"
  );

  const result = await continueConversation(situation.trim(), validHistory, message.trim());
  res.json(result);
});
