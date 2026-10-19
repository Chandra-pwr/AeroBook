import React, { useState } from 'react';

export default function App() {
  const [origin, setOrigin] = useState('DEL');
  const [dest, setDest] = useState('BOM');

  return (
    <div className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-wider text-sky-400">✈ AEROBOOK</h1>
        <div className="text-sm text-slate-400">Domain: <span className="text-sky-300 font-mono">devchandra.shop</span></div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4 space-y-8">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Book Flights Seamlessly</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="From (e.g. DEL)" />
            <input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="To (e.g. BOM)" />
            <button className="bg-sky-500 hover:bg-sky-600 transition font-bold rounded-lg p-3 text-white shadow-lg">Search Flights</button>
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-400">Connected Microservices</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-mono">
            {['user-service', 'flight-search-service', 'booking-service', 'payment-service', 'notification-service', 'admin-service'].map((s) => (
              <div key={s} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>{s}</span>
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
