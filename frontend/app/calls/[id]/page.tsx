import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, type Call } from "@/lib/supabase";

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const revalidate = 0;

export default async function CallDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const call = data as Call;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50/40">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fuchsia-500 hover:text-fuchsia-700 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to calls
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {call.caller_name || "Unknown Caller"}
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{formatDate(call.created_at)}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Call info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard label="Caller" value={call.caller_name || "Unknown"} />
          <InfoCard label="Phone" value={call.caller_phone || "Not provided"} />
          <InfoCard label="Duration" value={formatDuration(call.duration)} />
          <InfoCard
            label="Date"
            value={new Date(call.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        </div>

        {/* Next steps */}
        {call.next_steps && (
          <div className="bg-linear-to-r from-fuchsia-50 to-purple-50 border border-fuchsia-200/60 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 animate-pulse" />
              <p className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest">Next Steps</p>
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{call.next_steps}</p>
          </div>
        )}

        {/* Transcript */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Transcript</h2>
          {call.transcript && call.transcript.length > 0 ? (
            <div className="space-y-3">
              {call.transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "caller" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "caller"
                        ? "bg-white border border-slate-200 text-slate-700"
                        : "bg-linear-to-br from-slate-800 to-slate-900 text-white"
                    }`}
                  >
                    <p className={`text-[11px] font-bold mb-1 tracking-wide ${
                      msg.role === "caller" ? "text-orange-500" : "text-fuchsia-300"
                    }`}>
                      {msg.role === "caller" ? "Caller" : "Receptionist"}
                    </p>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-medium">No transcript available.</p>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-1 truncate">{value}</p>
    </div>
  );
}
