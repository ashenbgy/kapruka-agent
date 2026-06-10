"use client";

import { useEffect, useState } from "react";

/**
 * A simple analytics dashboard page. It reads the client-side analytics events
 * stored in localStorage under the key `giftmate_analytics` and displays a
 * summary count for each event type along with a table of recent events. This
 * page is primarily intended for the developer or competition judges to
 * inspect how users interact with the demo.
 */
export default function AnalyticsDashboard() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("giftmate_analytics");
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setEvents(parsed);
      }
    } catch (error) {
      console.error("Failed to parse analytics events", error);
    }
  }, []);

  // Aggregate counts by event type
  // Support both our preferred `eventType` field and a generic `type` field for legacy events.
  const counts = events.reduce<Record<string, number>>((acc, evt) => {
    const type: string = evt.eventType || evt.type;
    if (!type) return acc;
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-4 text-white sm:px-6">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Below is a summary of tracked events from this session. Events are
        stored client-side and persist across page reloads while using the
        same browser. No personally identifiable information is collected.
      </p>
      {events.length === 0 ? (
        <p className="text-zinc-400">No events recorded yet.</p>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Event counts</h2>
            <ul className="space-y-1">
              {Object.entries(counts).map(([type, count]) => (
                <li key={type} className="text-sm text-zinc-300">
                  <span className="font-bold text-emerald-400">{type}</span>: {count}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Recent events</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800 text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Time</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .slice()
                    .reverse()
                    .map((evt, index) => (
                      <tr key={index} className="border-b border-zinc-800 odd:bg-zinc-900">
                        <td className="px-4 py-2 whitespace-nowrap text-zinc-400">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-emerald-300">
                          {evt.eventType || evt.type}
                        </td>
                        <td className="px-4 py-2 text-zinc-300">
                          <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(evt.details || evt.data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}