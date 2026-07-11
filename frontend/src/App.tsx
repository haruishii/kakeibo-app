import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
};

type Transaction = {
  id: number;
  amount: number;
  date: string;
  content: string;
  payment_method: string;
  category: Category;
  user: {
    name: string;
  };
};

const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

const initialForm = {
  amount: "",
  date: new Date().toISOString().split("T")[0],
  content: "",
  payment_method: "現金",
  category_id: "1",
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    const [categoriesRes, transactionsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/categories`),
      fetch(`${apiBaseUrl}/transactions`),
    ]);
    const categoriesData = await categoriesRes.json();
    const transactionsData = await transactionsRes.json();
    setCategories(categoriesData);
    setTransactions(transactionsData);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${apiBaseUrl}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(initialForm);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">家計簿アプリ</h1>
          <p className="mt-2 text-sm text-slate-600">
            支出を登録して、一覧で確認できます。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow space-y-4"
          >
            <h2 className="text-xl font-semibold">収支入力</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm gap-1">
                <span>金額</span>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="rounded border border-slate-300 p-2"
                />
              </label>
              <label className="flex flex-col text-sm gap-1">
                <span>日付</span>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="rounded border border-slate-300 p-2"
                />
              </label>
              <label className="flex flex-col text-sm gap-1 md:col-span-2">
                <span>内容</span>
                <input
                  type="text"
                  required
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  className="rounded border border-slate-300 p-2"
                />
              </label>
              <label className="flex flex-col text-sm gap-1">
                <span>カテゴリ</span>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="rounded border border-slate-300 p-2"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm gap-1">
                <span>支払い方法</span>
                <input
                  type="text"
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({ ...form, payment_method: e.target.value })
                  }
                  className="rounded border border-slate-300 p-2"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
            >
              登録する
            </button>
          </form>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">収支一覧</h2>
            <ul className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="rounded border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{transaction.content}</p>
                      <p className="text-sm text-slate-500">
                        {transaction.date} / {transaction.category.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ¥{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {transaction.payment_method}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
