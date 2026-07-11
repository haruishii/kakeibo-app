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
    const { amount, date, content, category_id, paymentmethod_id } = req.body;

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
        user_id: user.id,
        group_id: group.id,
        category_id: Number(category_id),
        paymentmethod_id: Number(paymentmethod_id) || 1,
      },
    });

    console.log(
      `✅  success! ￥${transaction.amount} (${transaction.content})`,
    );
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
        paymentmethod: true,
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
    console.log(`🗑️   success! ID: ${transactionId}`);
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

app.get("/api/payment-methods", async (_req, res) => {
  try {
    const paymentMethods = await prisma.paymentmethod.findMany({
      orderBy: { id: "asc" }, // ID順（現金、クレジットカード...の順）に並べる
    });
    res.json(paymentMethods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payment methods." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
