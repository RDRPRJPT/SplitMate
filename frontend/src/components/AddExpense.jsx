import { useState } from "react";
import { apiRequest } from "../api";

function AddExpense({ groupID, members, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!amount || Number(amount) <= 0 || !Number.isInteger(Number(amount))) {
      setError("Enter a valid positive whole-number amount");
      return;
    }

    if (!paidBy) {
      setError("Please select who paid");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const data = await apiRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          paidBy: Number(paidBy),
          groupID: Number(groupID),
        }),
      });

      const payer = members.find(
        (member) => member.id === Number(paidBy)
      );

      onExpenseAdded({
        ...data,
        paid_by_name: payer?.name || "Unknown",
      });

      setDescription("");
      setAmount("");
      setPaidBy("");
      setSuccess("Expense added successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleAddExpense} className="mt-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Description
        </label>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner, Petrol, Hotel..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-lime-300"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Amount (₹)
        </label>

        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 900"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-lime-300"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Paid by
        </label>

        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#151F30] px-4 py-3 text-white outline-none focus:border-lime-300"
        >
          <option value="">Select a member</option>

          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {success && (
        <p className="text-sm text-lime-300">{success}</p>
      )}

      <button
        type="submit"
        disabled={adding || members.length === 0}
        className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-lime-200 disabled:opacity-50"
      >
        {adding ? "Adding..." : "+ Add Expense"}
      </button>
    </form>
  );
}

export default AddExpense;