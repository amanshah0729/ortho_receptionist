import Link from "next/link";
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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const revalidate = 0;

export default async function Dashboard() {
  const { data: calls, error } = await supabase
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-semibold">Error loading calls: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50/40">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vasu Smiles</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Call Dashboard</p>
            </div>
          </div>
          <div className="bg-slate-100 text-slate-600 font-semibold text-sm px-4 py-1.5 rounded-full">
            {calls?.length ?? 0} calls
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        {!calls || calls.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-fuchsia-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-500">No calls yet</p>
            <p className="text-sm mt-1">Calls will appear here once the receptionist handles them.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-lg shadow-slate-200/50">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-200 bg-linear-to-r from-slate-50 to-slate-100/50 text-left">
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider w-[130px]">
                    Date / Time
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider w-[110px]">
                    Caller
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider w-[80px]">
                    Duration
                  </th>
                  <th className="px-6 py-4 font-bold text-fuchsia-500 uppercase text-xs tracking-wider w-[25%]">
                    Next Steps
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">
                    Transcript
                  </th>
                </tr>
              </thead>
              <tbody>
                {(calls as Call[]).map((call, idx) => (
                  <tr
                    key={call.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-purple-50/30 transition-colors align-top"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/calls/${call.id}`}
                        className="font-bold text-slate-800 hover:text-fuchsia-600 transition-colors"
                      >
                        {formatDate(call.created_at)}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-800">
                        {call.caller_name || "Unknown"}
                      </span>
                      {call.caller_phone && (
                        <p className="text-xs text-slate-400 mt-0.5">{call.caller_phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-600 tabular-nums">
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-h-44 overflow-y-auto pr-2">
                        {call.next_steps ? (
                          <div className="bg-linear-to-r from-fuchsia-50 to-purple-50 border border-fuchsia-200/60 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-widest">
                                Action Required
                              </span>
                            </div>
                            <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                              {call.next_steps}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-h-52 overflow-y-auto pr-2 space-y-2.5">
                        {call.transcript && call.transcript.length > 0 ? (
                          call.transcript.map((msg, i) => (
                            <div key={i} className="leading-relaxed">
                              <span
                                className={`font-bold text-[13px] ${
                                  msg.role === "caller"
                                    ? "text-orange-500"
                                    : "text-fuchsia-500"
                                }`}
                              >
                                {msg.role === "caller" ? "Caller" : "Receptionist"}:
                              </span>{" "}
                              <span className="text-slate-600 text-[13px]">{msg.text}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-300 font-medium">No transcript</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
