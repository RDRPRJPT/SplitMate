
function GroupCard({ group, index, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-lime-300/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 sm:p-6"
    >
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <span className="text-xs font-semibold tracking-widest text-lime-300">
          GROUP / {String(index + 1).padStart(2, "0")}
        </span>

        <span className="text-xl text-slate-500 transition group-hover:text-lime-300">
          ↗
        </span>
      </div>

      <h4 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
        {group.name}
      </h4>

      <p className="mt-2 break-words text-sm text-slate-400">
        Group ID: {group.id}
      </p>

      <div className="mt-6 border-t border-white/10 pt-4 sm:mt-8">
        <span className="text-sm text-slate-400">
          View group details
        </span>
      </div>
    </button>
  );
}

export default GroupCard;
