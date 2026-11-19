function GroupCard({ group, index, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-lime-300/40 hover:bg-white/[0.07]"
    >
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-lime-300">
          GROUP / {String(index + 1).padStart(2, "0")}
        </span>

        <span className="text-xl text-slate-500 transition group-hover:text-lime-300">
          ↗
        </span>
      </div>

      <h4 className="text-2xl font-semibold tracking-tight">
        {group.name}
      </h4>

      <p className="mt-2 text-sm text-slate-400">
        Group ID: {group.id}
      </p>

      <div className="mt-8 border-t border-white/10 pt-4">
        <span className="text-sm text-slate-400">
          View group details
        </span>
      </div>
    </div>
  );
}

export default GroupCard;