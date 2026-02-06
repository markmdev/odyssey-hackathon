interface Props {
  status: string;
  progress: number;
}

export default function GeneratingScreen({ status, progress }: Props) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/10 border-t-indigo-500" />
      <h2 className="text-2xl font-semibold">Building your palace...</h2>
      <p className="text-sm text-gray-500">{status}</p>
      <div className="h-1 w-72 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
