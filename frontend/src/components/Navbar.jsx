function Navbar() {
  return (
    <nav className="border-b border-white/10 px-6 py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">
          split<span className="text-lime-300">mate.</span>
        </h1>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          Your expense space
        </div>
      </div>
    </nav>
  );
}

export default Navbar;