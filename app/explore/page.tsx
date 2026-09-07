"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Compass, MapPin, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import destinations from "@/data/destinations.json";
import hotels from "@/data/hotels.json";
import restaurants from "@/data/restaurants.json";
import activities from "@/data/activities.json";
import type { Destination } from "@/types/travel";
import { formatINR } from "@/lib/trip";

const filters = ["All", "Mountains", "Beach", "Nature", "Heritage", "Spiritual", "Adventure", "Wildlife"];

export default function ExplorePage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Destination | null>(null);

  useEffect(() => {
    const destinationFromUrl = new URLSearchParams(window.location.search).get("destination");
    if (destinationFromUrl) {
      const hit = destinations.find((d) => d.name.toLowerCase() === destinationFromUrl.toLowerCase());
      if (hit) setSelected(hit as Destination);
    }
  }, []);

  const filtered = useMemo(() => destinations.filter((destination) => {
    const matchesFilter = filter === "All" || destination.category.includes(filter);
    const haystack = `${destination.name} ${destination.state} ${destination.description} ${destination.category.join(" ")}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [filter, query]);

  return <main className="bg-[#f7f9fc] pb-20">
    <section className="bg-white">
      <div className="container-page py-12 sm:py-16">
        <div className="max-w-3xl"><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">Explore India with TravelSetu</div><h1 className="mt-3 text-[40px] font-black tracking-[-0.045em] text-[#10243e] sm:text-[54px]">Find a place that fits <span className="text-[#0b63ce]">your mood.</span></h1><p className="mt-4 text-[15px] leading-7 text-[#6d7c90]">Browse the local TravelSetu demo catalog of destinations, stays, food and experiences. Choose a place to see its story and planning details.</p></div>
        <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8898aa]" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search destinations, states or experiences" className="w-full rounded-2xl border border-[#dfe7ef] bg-white py-4 pl-11 pr-4 text-[14px] outline-none ring-0 focus:border-[#9cc4f3]" /></div><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2.5 text-[12px] font-extrabold ${filter === item ? "bg-[#0b63ce] text-white" : "border border-[#e0e7ee] bg-white text-[#53657a]"}`}>{item}</button>)}</div></div>
      </div>
    </section>

    <section className="container-page pt-9"><div className="mb-5 flex items-center justify-between"><div className="text-[13px] font-bold text-[#6d7c90]">Showing <span className="font-extrabold text-[#10243e]">{filtered.length}</span> destinations</div><Link href="/plan-trip" className="inline-flex items-center gap-2 text-[12px] font-extrabold text-[#0b63ce]">Plan from a destination <ArrowRight size={15} /></Link></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((destination) => <DestinationExploreCard key={destination.id} destination={destination} onOpen={() => setSelected(destination as Destination)} />)}</div>{filtered.length === 0 && <div className="rounded-[26px] border border-dashed border-[#ced8e4] bg-white p-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6ff] text-[#0b63ce]"><Compass size={22} /></div><h2 className="mt-4 text-[20px] font-black text-[#10243e]">No destinations found</h2><p className="mt-2 text-[13px] text-[#6d7c90]">Try a broader search or reset the category filter.</p></div>}</section>

    {selected && <DestinationModal destination={selected} onClose={() => setSelected(null)} />}
  </main>;
}

function DestinationExploreCard({ destination, onOpen }: { destination: typeof destinations[number]; onOpen: () => void }) { return <button onClick={onOpen} className="group overflow-hidden rounded-[24px] border border-[#e4ebf2] bg-white text-left shadow-[0_16px_38px_rgba(16,36,62,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(16,36,62,.1)]"><div className="relative h-56 overflow-hidden"><img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#081c34]/75 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 right-4 text-white"><div className="flex items-center justify-between"><div><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/75">{destination.state}</div><div className="mt-1 text-[27px] font-black tracking-[-0.03em]">{destination.name}</div></div><span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#10243e]"><ArrowRight size={17} /></span></div></div></div><div className="p-5"><div className="flex flex-wrap gap-2">{destination.category.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-[10px] font-extrabold text-[#0b63ce]">{item}</span>)}</div><p className="mt-3 min-h-12 text-[13px] leading-5 text-[#6d7c90]">{destination.description}</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#edf1f5] pt-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8592a3]">Best time</div><div className="mt-1 text-[12px] font-extrabold text-[#20364f]">{destination.bestTime}</div></div><div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8592a3]">Budget</div><div className="mt-1 text-[12px] font-extrabold text-[#20364f]">from {formatINR(destination.estimatedBudget.budget)}</div></div></div></div></button>; }

function DestinationModal({ destination, onClose }: { destination: Destination; onClose: () => void }) {
  const destinationHotels = hotels.filter((hotel) => hotel.destinationId === destination.id);
  const destinationRestaurants = restaurants.filter((restaurant) => restaurant.destinationId === destination.id);
  const destinationActivities = activities.filter((activity) => activity.destinationId === destination.id);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071e38]/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="mx-auto my-6 max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.22)]"><div className="relative h-72"><img src={destination.image} alt={destination.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#071e38]/80 to-transparent" /><button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#10243e]"><X size={18} /></button><div className="absolute bottom-6 left-6 text-white sm:left-8"><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/75">{destination.state}</div><h2 className="mt-1 text-[38px] font-black tracking-[-0.04em]">{destination.name}</h2><div className="mt-2 flex items-center gap-2 text-[13px] text-white/85"><MapPin size={14} /> {destination.latitude.toFixed(3)}, {destination.longitude.toFixed(3)}</div></div></div><div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_.8fr]"><div><div className="flex flex-wrap gap-2">{destination.category.map((item) => <span key={item} className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-[11px] font-extrabold text-[#0b63ce]">{item}</span>)}</div><p className="mt-5 text-[15px] leading-7 text-[#5e7086]">{destination.description}</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Info title="Best time" value={destination.bestTime} /><Info title="Estimated budget" value={`${formatINR(destination.estimatedBudget.budget)} – ${formatINR(destination.estimatedBudget.premium)}`} /></div><div className="mt-8"><SectionTitle icon={<Sparkles size={16} />} title="Popular experiences" /><div className="mt-3 grid gap-2 sm:grid-cols-2">{destinationActivities.map((activity) => <div key={activity.id} className="rounded-xl border border-[#e8eef4] p-3"><div className="text-[13px] font-extrabold text-[#20364f]">{activity.name}</div><div className="mt-1 text-[11px] text-[#7a899a]">{activity.category} • {activity.durationHours}h • {formatINR(activity.estimatedCost)}</div></div>)}</div></div></div><aside><div className="rounded-2xl bg-[#f7faff] p-5"><div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#0b63ce]">Plan smarter</div><Link href={`/plan-trip?destination=${encodeURIComponent(destination.name)}`} className="mt-3 flex items-center justify-between rounded-xl bg-[#0b63ce] px-4 py-3 text-[13px] font-extrabold text-white">Plan {destination.name} <ArrowRight size={16} /></Link><div className="mt-5 grid gap-3"><Info title="Demo hotel options" value={`${destinationHotels.length} curated stays`} /><Info title="Local food" value={`${destinationRestaurants.length} restaurant picks`} /></div></div><div className="mt-4 rounded-2xl border border-[#dceee0] bg-[#f3fbf5] p-5"><SectionTitle icon={<ShieldCheck size={16} />} title="Safety tips" /><div className="mt-3 space-y-2">{destination.safetyTips.map((tip) => <div key={tip} className="flex gap-2 text-[12px] leading-5 text-[#4d6c55]"><Check size={14} className="mt-0.5 shrink-0 text-[#2c9a55]" />{tip}</div>)}</div></div></aside></div></div></div>;
}
function Info({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border border-[#e6edf3] bg-white p-3.5"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8592a3]">{title}</div><div className="mt-1 text-[12px] font-extrabold text-[#20364f]">{value}</div></div>; }
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#20364f]"><span className="text-[#0b63ce]">{icon}</span>{title}</div>; }
