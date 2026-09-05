const RULES = [
  { icon: "🏳️", text: "One flag per company. Pick the territory that fits — you can always claim a second one later." },
  { icon: "🔗", text: "Your website must be a real, live product. Placeholder pages and squatting get a territory reclaimed." },
  { icon: "🔒", text: "Price is fixed the moment you open checkout — area × $2, no bidding, no surprise fees at payment." },
  { icon: "♾️", text: "Once a payment is confirmed, that patch is permanently yours. No renewals, no expiry, no reason to lose it." },
];

export function Rules() {
  return (
    <section id="rules" className="mx-auto max-w-4xl px-5 py-16">
      <h2 className="text-center text-3xl font-bold text-land-900">The rules fit on a napkin</h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-land-700">No fine print. Here's the whole game.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {RULES.map((r) => (
          <li key={r.text} className="flex items-start gap-3 rounded-2xl border-2 border-land-100 bg-white p-4">
            <span className="text-2xl">{r.icon}</span>
            <span className="text-sm text-land-800">{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
