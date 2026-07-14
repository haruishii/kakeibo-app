import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Category = { id: number; name: string };
type PaymentMethod = { id: number; name: string };
type Transaction = {
  id: number;
  amount: number;
  date: string;
  content: string;
  paymentmethod: PaymentMethod;
  category: Category;
  user: { name: string };
};

const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

const initialForm = {
  amount: "",
  date: new Date().toISOString().split("T")[0],
  content: "",
  paymentmethod_id: "1",
  category_id: "1",
};

// グラフの色分け用カラーコード
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#FF6666",
];

function App() {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 🌟 追加：現在表示している「月」を管理する状態（初期値は今月）
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    const [categoriesRes, paymentMethodsRes, transactionsRes] =
      await Promise.all([
        fetch(`${apiBaseUrl}/categories`),
        fetch(`${apiBaseUrl}/payment-methods`),
        fetch(`${apiBaseUrl}/transactions`),
      ]);
    const categoriesData = await categoriesRes.json();
    const paymentMethodsData = await paymentMethodsRes.json();
    const transactionsData = await transactionsRes.json();
    setCategories(categoriesData);
    setPaymentMethods(paymentMethodsData);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("本当にこのデータを削除しますか？")) return;
    await fetch(`${apiBaseUrl}/transactions/${id}`, { method: "DELETE" });
    await loadData();
  };

  // 🌟 追加機能1：月を切り替える関数
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };
  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  // 🌟 追加機能2：現在の月に該当するデータだけを絞り込む
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getFullYear() === currentMonth.getFullYear() &&
      tDate.getMonth() === currentMonth.getMonth()
    );
  });

  // 🌟 追加機能3：円グラフ用にカテゴリごとの合計額を計算する
  const calculateChartData = () => {
    // 1. カテゴリごとに金額を合算する
    const categoryTotals = filteredTransactions.reduce(
      (acc, transaction) => {
        const categoryName = transaction.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += transaction.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 2. 全体の合計金額を計算する
    const totalAmount = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // 3. Rechartsが読み込める配列形式に変換し、割合（%）も計算する
    return Object.keys(categoryTotals).map((name) => {
      const value = categoryTotals[name];
      const percentage =
        totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : "0";
      return { name, value, percentage };
    });
  };

  const chartData = calculateChartData();
  const monthlyTotal = chartData.reduce((sum, item) => sum + item.value, 0);

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
          {/* 左側：収支入力フォーム（変更なし） */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow space-y-4 h-fit"
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
                <select
                  value={form.paymentmethod_id}
                  onChange={(e) =>
                    setForm({ ...form, paymentmethod_id: e.target.value })
                  }
                  className="rounded border border-slate-300 p-2 bg-white"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white w-full"
            >
              登録する
            </button>
          </form>

          {/* 右側：収支一覧とグラフ */}
          <div className="rounded-2xl bg-white p-6 shadow space-y-6">
            {/* 月切り替えヘッダー */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
              >
                ◀ 先月
              </button>
              <h2 className="text-xl font-bold">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </h2>
              <button
                onClick={handleNextMonth}
                className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
              >
                来月 ▶
              </button>
            </div>

            {/* 収支一覧（絞り込み済み） */}
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  この月のデータはありません
                </p>
              ) : (
                filteredTransactions.map((transaction) => (
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
                          {transaction.paymentmethod?.name}
                        </p>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="mt-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <hr className="border-slate-200" />

            {/* 円グラフセクション */}
            <div>
              <h3 className="text-lg font-semibold text-center mb-2">
                月間合計: ¥{monthlyTotal.toLocaleString()}
              </h3>
              {chartData.length > 0 && (
                <>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {chartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            `¥${Number(value).toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* カテゴリごとの詳細リスト（名前・割合・金額） */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    {chartData.map((data, index) => (
                      <div
                        key={data.name}
                        className="flex items-center space-x-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium truncate">
                          {data.name}
                        </span>
                        <span className="text-slate-500">
                          ({data.percentage}%)
                        </span>
                        <span className="ml-auto font-bold">
                          ¥{data.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
