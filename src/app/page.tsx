import Link from 'next/link';

const features = [
  {
    title: 'Donor experience',
    description: 'Capture surplus food with photos, freshness, and live map pin + OTP for handover.',
    href: '/donor',
  },
  {
    title: 'Volunteer radar',
    description: 'Filters donations within 5 km and sends browser push alerts with lock + OTP verify.',
    href: '/volunteer',
  },
  {
    title: 'Admin pulse',
    description: 'Real-time dashboard of active drops, meals saved, and proof-of-distribution status.',
    href: '/admin',
  },
];

export default function Home() {
  return (
    <section className="rounded-3xl bg-linear-to-br from-emerald-50 via-white to-slate-50 p-10 shadow-sm">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">MealBridge</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          Hyper-local food donation logistics in under three hours.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Donors post surplus meals, volunteers within 5 km get instant push alerts, and admins monitor meals saved
          (1 kg = 4 meals). Built with Next.js + Firebase + Google Maps + FCM.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/donor"
            className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-emerald-500"
          >
            Launch donor console
          </Link>
          <Link
            href="/volunteer"
            className="rounded-full border border-emerald-200 px-6 py-3 font-semibold text-emerald-700"
          >
            View volunteer radar
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
