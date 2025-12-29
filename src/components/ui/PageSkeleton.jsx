export default function PageSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 animate-pulse">
      <div className="h-6 w-56 bg-slate-200 rounded" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
        <div className="h-4 w-4/6 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
