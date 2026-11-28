
import { useEffect, useState } from "react";
import { apiRequest } from "../api";

import AddMembers from "../components/AddMembers";
import AddExpense from "../components/AddExpense";

function GroupDetails({ group, onBack }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const refreshFinancials = async () => {
    try {
      const [balancesData, settlementsData] = await Promise.all([
        apiRequest(`/api/groups/${group.id}/balances`),
        apiRequest(`/api/groups/${group.id}/settlements`),
      ]);

      setBalances(balancesData);
      setSettlements(settlementsData);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          membersData,
          expensesData,
          balancesData,
          settlementsData,
        ] = await Promise.all([
          apiRequest(`/api/groups/${group.id}/members`),
          apiRequest(`/api/expenses?groupID=${group.id}`),
          apiRequest(`/api/groups/${group.id}/balances`),
          apiRequest(`/api/groups/${group.id}/settlements`),
        ]);

        setMembers(membersData);
        setExpenses(expensesData);
        setBalances(balancesData);
        setSettlements(settlementsData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [group.id]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <button
        onClick={onBack}
        className="mb-10 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        ← Back to groups
      </button>

      <section>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-lime-300">
          Your space / Group details
        </p>

        <h2 className="break-words text-3xl font-bold tracking-tight sm:text-6xl">
          {group.name}
        </h2>

        <p className="mt-4 text-slate-400">
          Group ID: {group.id}
        </p>
      </section>

      {loading && (
        <p className="mt-10 text-slate-400">
          Loading group data...
        </p>
      )}

      {error && (
        <p className="mt-10 text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* Balances and settlements */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">

            {/* Balances */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
              <h3 className="text-xl font-semibold">Balances</h3>
              <p className="mt-1 text-sm text-slate-400">
                See who owes and who gets money back
              </p>

              <div className="mt-6 space-y-4">
                {balances.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="break-words text-slate-300">
                      {member.name}
                    </span>

                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        member.net_balance > 0
                          ? "text-lime-300"
                          : member.net_balance < 0
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {member.net_balance > 0
                        ? `Gets ₹${member.net_balance}`
                        : member.net_balance < 0
                        ? `Owes ₹${Math.abs(member.net_balance)}`
                        : "Settled up"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Suggested settlements */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
              <h3 className="text-xl font-semibold">
                Suggested settlements
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Simplest way to settle the group's dues
              </p>

              <div className="mt-6 space-y-4">
                {settlements.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Everyone is settled up.
                  </p>
                ) : (
                  settlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] p-3 sm:gap-3 sm:p-4"
                    >
                      <div className="break-words text-sm">
                        <span className="text-slate-300">
                          {settlement.from}
                        </span>
                        <span className="mx-2 text-lime-300">→</span>
                        <span className="text-slate-300">
                          {settlement.to}
                        </span>
                      </div>

                      <span className="shrink-0 font-semibold text-lime-300">
                        ₹{settlement.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">

            {/* Members section */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
              <h3 className="text-xl font-semibold">Members</h3>

              <p className="mt-1 text-sm text-slate-400">
                {members.length} people in this group
              </p>

              <div className="mt-6 space-y-4">
                {members.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No members yet.
                  </p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="sm:flex sm:items-center sm:justify-between"
                    >
                      <p className="block break-words">
                        {member.name}
                      </p>

                      <p className="mt-1 block break-all text-sm text-slate-500 sm:mt-0 sm:text-right">
                        {member.email}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h4 className="font-semibold">Add people</h4>

                <AddMembers
                  groupID={group.id}
                  onMemberAdded={(newMember) => {
                    setMembers((previousMembers) => [
                      ...previousMembers,
                      newMember,
                    ]);

                    refreshFinancials();
                  }}
                />
              </div>
            </section>

            {/* Expenses section */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
              <h3 className="text-xl font-semibold">Expenses</h3>

              <p className="mt-1 text-sm text-slate-400">
                {expenses.length} recorded expenses
              </p>

              <div className="mt-6 space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No expenses yet.
                  </p>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <button
                        onClick={() =>
                          setExpandedExpense(
                            expandedExpense === expense.id
                              ? null
                              : expense.id
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium">
                            {expense.description}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Paid by {expense.paid_by_name}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-lime-300">
                            ₹{expense.amount}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {expandedExpense === expense.id
                              ? "Hide details ↑"
                              : "View split ↓"}
                          </p>
                        </div>
                      </button>

                      {expandedExpense === expense.id && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                          <p className="mb-3 text-sm font-semibold text-slate-300">
                            Individual shares
                          </p>

                          {!expense.splits || expense.splits.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No split details available for this expense.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {expense.splits.map((split) => (
                                <div
                                  key={split.user_id}
                                  className="flex justify-between gap-3 text-sm"
                                >
                                  <span className="break-words text-slate-400">
                                    {split.user_name}
                                  </span>

                                  <span className="shrink-0 font-medium">
                                    ₹{split.amount_owed}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h4 className="font-semibold">Add an expense</h4>

                <AddExpense
                  groupID={group.id}
                  members={members}
                  onExpenseAdded={(newExpense) => {
                    setExpenses((previousExpenses) => [
                      ...previousExpenses,
                      newExpense,
                    ]);

                    refreshFinancials();
                  }}
                />
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

export default GroupDetails;
