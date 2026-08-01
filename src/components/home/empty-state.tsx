export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-slate">{message}</p>
    </div>
  );
}
