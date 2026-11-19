function CreateGroupModal({
  showModal,
  onClose,
  onCreate,
  groupName,
  setGroupName,
  creating,
  createError,
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151F30] p-7 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lime-300">
              New workspace
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Create a group
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-slate-400 transition hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={onCreate}>
          <label className="mb-2 block text-sm text-slate-300">
            Group name
          </label>

          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Goa Trip, Flat Expenses..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-300"
          />

          {createError && (
            <p className="mt-2 text-sm text-red-400">
              {createError}
            </p>
          )}

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-lime-200 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;