import Link from "next/link";
import { ArrowRight, CalendarDays, MapPinned, ShieldCheck, Sparkles, WalletCards, CloudSun, Route, UsersRound } from "lucide-react";
import { FeatureCard } from "@/app/components/FeatureCard";
import { DestinationCard } from "@/app/components/DestinationCard";

import destinationData from "@/data/destinations.json";

const destinations = destinationData.slice(0, 5).map((destination) => ({
  name: destination.name,
  category: destination.category.slice(0, 2).join(" • "),
  description: destination.description,
  image: destination.image,
}));

const floatingFeatures = [
  { icon: CloudSun, title: "Live Weather" },
  { icon: Sparkles, title: "AI Travel Planner" },
  { icon: WalletCards, title: "Smart Budget" },
  { icon: ShieldCheck, title: "Safety First" },
  { icon: Route, title: "Dynamic Replanning" },
];

export default function Home() {
  return (
    <main>
      <section className="hero-mountain relative min-h-[720px] overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-[#071e38]/60 via-[#071e38]/20 to-transparent" />
        <div className="container-page relative flex min-h-[720px] items-center py-14">
          <div className="max-w-[640px] pt-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles size={14} /> AI-powered adaptive travel
            </div>
            <h1 className="text-[52px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[66px]">Your Journey.<br />Your Budget.<br /><span className="text-[#ffd447]">Your Way.</span></h1>
            <p className="mt-6 max-w-xl text-[18px] leading-8 text-white/85 sm:text-[19px]">Plan smarter with AI-powered, adaptive travel.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/plan-trip" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffd447] px-6 py-3.5 text-[14px] font-extrabold text-[#10243e] shadow-[0_10px_25px_rgba(255,212,71,.22)] transition hover:-translate-y-0.5">Plan My Trip <ArrowRight size={17} /></Link>
              <Link href="/explore" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-[14px] font-extrabold text-white backdrop-blur transition hover:bg-white/15">Explore Destinations</Link>
            </div>
          </div>
        </div>

        <div className="container-page absolute inset-x-0 bottom-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {floatingFeatures.map(({ icon: Icon, title }) => (
              <div key={title} className="glass flex items-center gap-3 rounded-[16px] border border-white/50 px-4 py-3 text-[#16314d] shadow-[0_14px_30px_rgba(0,0,0,.12)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf3ff] text-[#0b63ce]"><Icon size={18} /></span>
                <span className="text-[12px] font-extrabold">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-2 sm:-mt-12">
        <div className="container-page">
          <div className="rounded-[26px] border border-[#e7edf4] bg-white p-5 shadow-[0_24px_55px_rgba(16,36,62,.12)] sm:p-7">
            <div className="grid gap-3 md:grid-cols-[1.2fr_1.05fr_0.9fr_0.9fr_auto] md:items-end">
              <Field icon={MapPinned} label="Destination" value="Manali, Himachal Pradesh" />
              <Field icon={CalendarDays} label="Travel Dates" value="15 Oct — 20 Oct" />
              <Field icon={UsersRound} label="Travellers" value="3 Travellers" />
              <Field icon={WalletCards} label="Budget" value="₹20,000" />
              <Link href="/plan-trip" className="flex min-h-[62px] items-center justify-center rounded-xl bg-[#0b63ce] px-6 text-[13px] font-extrabold text-white transition hover:bg-[#074b9d]">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="max-w-2xl">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">Why choose TravelSetu</div>
          <h2 className="mt-3 text-[34px] font-black tracking-[-0.035em] text-[#10243e] sm:text-[42px]">Everything you need for a smarter trip.</h2>
          <p className="mt-4 text-[15px] leading-7 text-[#6d7c90]">One connected travel workspace for planning, budget control, real-time safety and weather-aware decisions.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard icon={Sparkles} title="AI-Powered Planning" description="Turn your dates, budget and interests into a practical trip plan." />
          <FeatureCard icon={WalletCards} title="Budget Optimisation" description="Keep the whole journey aligned with the budget you actually set." />
          <FeatureCard icon={ShieldCheck} title="Real-time Safety" description="Surface safety information and weather conditions alongside your plans." />
          <FeatureCard icon={Route} title="Dynamic Replanning" description="Adapt outdoor plans when conditions change instead of starting over." />
        </div>
      </section>

      <section className="bg-[#f6f9fd] py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">Popular destinations</div>
              <h2 className="mt-3 text-[34px] font-black tracking-[-0.035em] text-[#10243e] sm:text-[42px]">Pick a place. We’ll help plan the rest.</h2>
            </div>
            <Link href="/explore" className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#0b63ce]">View all destinations <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {destinations.map((destination) => <DestinationCard key={destination.name} {...destination} />)}
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="overflow-hidden rounded-[30px] bg-[#0b63ce] px-6 py-12 text-white shadow-travel sm:px-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">Ready when you are</div>
              <h2 className="mt-3 text-[36px] font-black tracking-[-0.04em] sm:text-[44px]">Build a trip that feels like yours.</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/80">Start with your destination, dates, travellers and budget. Phase 1 sets up the polished travel experience; the next phases connect the real intelligence behind it.</p>
            </div>
            <Link href="/plan-trip" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ffd447] px-6 py-3.5 text-[14px] font-extrabold text-[#10243e]">Start Planning <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof MapPinned; label: string; value: string }) {
  return (
    <div className="min-h-[62px] rounded-xl border border-[#e6ebf1] bg-[#fbfcfe] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8592a3]"><Icon size={14} /> {label}</div>
      <div className="mt-1.5 text-[13px] font-extrabold text-[#20364f]">{value}</div>
    </div>
  );
}
