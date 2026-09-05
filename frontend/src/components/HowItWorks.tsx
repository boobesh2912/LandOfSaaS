const STEPS = [
  { icon: "🧭", title: "Scout the map", body: "Hover any patch to see its size and price. No account needed to look around." },
  { icon: "🚩", title: "Stake your claim", body: "Click a free patch and it's held for you for 15 minutes while you get set up." },
  { icon: "🎨", title: "Deck it out", body: "Drop in your logo, pick a flag color, write a one-line caption, link your site." },
  { icon: "👑", title: "Fly your flag forever", body: "Pay once. No subscriptions, no renewals — your patch is yours for good." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-3xl font-bold text-land-900">See → Select → Customize → Own</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-land-700">
        No ranking battles. No algorithm to please. Just pick your spot on the map and it's yours.
      </p>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-3xl border-2 border-land-100 bg-white p-5 text-center shadow-sm">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-bold text-land-900">
              {i + 1}
            </span>
            <div className="text-4xl">{s.icon}</div>
            <h3 className="mt-2 font-display font-bold text-land-900">{s.title}</h3>
            <p className="mt-1 text-sm text-land-700">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
