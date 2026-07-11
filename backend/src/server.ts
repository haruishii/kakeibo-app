import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const apiBaseUrl = process.env.VITE_API_URL || "/api";

// Backend / Controller layer: express middleware and routes
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, date, content, payment_method, category_id } = req.body;

    const user = await prisma.user.findFirst();
    const group = await prisma.group.findFirst();

    if (!user || !group) {
      return res.status(500).json({ error: "Seed data is missing." });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        date,
        content,
        payment_method,
        user_id: user.id,
        group_id: group.id,
        category_id: Number(category_id),
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create transaction." });
  }
});

app.get("/api/transactions", async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        category: true,
        user: true,
      },
      orderBy: { id: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// DELETE endpoint for a specific transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    // 1. Extract transaction ID from the URL parameters
    const transactionId = Number(req.params.id);

    // 2. Delete the record via Prisma
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // 3. Send success response to the client
    res.json({ message: "Transaction deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete transaction." });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
