export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="spinner-ring" />
      <p className="text-xs text-slate-500 tracking-widest uppercase">Loading</p>
    </div>
  );
}
