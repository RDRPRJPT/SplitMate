import GroupCard from "../components/GroupCard";

function Dashboard({
  groups,
  loading,
  error,
  onCreateGroup,
  onSelectGroup,
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="mb-14">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-lime-300">
          Your space / Overview
        </p>

        <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Expenses, without
          <br />
          the <span className="text-lime-300">awkwardness.</span>
        </h2>

        <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
          Your groups. Your people. Every rupee accounted for.
          Keep track of shared expenses without the headache.
        </p>
      </section>

      <section>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">Your groups</h3>
            <p className="mt-1 text-sm text-slate-400">
              All your shared spaces in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-300">
              {groups.length} groups
            </span>

            <button
              onClick={onCreateGroup}
              className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:scale-105 hover:bg-lime-200"
            >
              + New Group
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-slate-400">Loading your groups...</p>
        )}

        {error && (
          <p className="text-red-400">{error}</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p className="text-slate-400">
            No groups yet. Create your first group!
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              onClick={() => onSelectGroup(group)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;