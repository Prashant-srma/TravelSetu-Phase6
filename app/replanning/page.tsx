"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CloudRain, LoaderCircle, MapPin, Sparkles, Wind } from "lucide-react";
import type { Itinerary } from "@/lib/itinerary";
import type { WeatherResponse } from "@/lib/weather";
import { formatINR } from "@/lib/trip";

export default function ReplanningPage() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [message, setMessage] = useState("");
  const selectedWeather = useMemo(() => weather?.daily.find((item) => item.date === itinerary?.days.find((d) => d.day === selectedDay)?.date), [weather, itinerary, selectedDay]);
  const selectedItineraryDay = itinerary?.days.find((item) => item.day === selectedDay) || itinerary?.days[0];

  useEffect(() => {
    const raw = localStorage.getItem("travelsetu_itinerary");
    if (!raw) { setLoading(false); return; }
    try { const parsed = JSON.parse(raw) as Itinerary; setItinerary(parsed); setSelectedDay(parsed.days[0]?.day || 1); } catch { setMessage("Saved itinerary could not be read."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!itinerary) return;
    fetch("/api/weather", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: itinerary.destination, startDate: itinerary.startDate, endDate: itinerary.endDate }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setWeather(data as WeatherResponse); }).catch((error) => setMessage(error instanceof Error ? error.message : "Weather service is temporarily unavailable."));
  }, [itinerary]);

  async function replan() {
    if (!itinerary || !selectedItineraryDay || !selectedWeather) return;
    setPlanning(true); setMessage("");
    try {
      const rawTrip = localStorage.getItem("travelsetu_trip");
      const trip = rawTrip ? JSON.parse(rawTrip) : { from: itinerary.from, destination: itinerary.destination, startDate: itinerary.startDate, endDate: itinerary.endDate, travellers: itinerary.travellers, budget: itinerary.estimatedCost, interests: [], foodPreference: "Any", transport: "Any", travelStyle: "Balanced", accommodationPreference: "Comfortable stay", specialRequirements: "" };
      const response = await fetch("/api/replan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trip, day: selectedDay, weatherDay: selectedWeather, affectedActivity: selectedItineraryDay.activities.find((item) => item.type === "activity") || selectedItineraryDay.activities[0] }) });
      const data = await response.json(); if (!response.ok || !data.replacement) throw new Error(data.error || "Could not create an alternative plan");
      localStorage.setItem("travelsetu_itinerary", JSON.stringify(data.replacement)); localStorage.setItem("travelsetu_itinerary_source", data.source || "fallback"); localStorage.setItem("travelsetu_itinerary_message", data.reason || "Weather-safe plan accepted.");
      setItinerary(data.replacement as Itinerary); setMessage(data.reason || "AI suggested a safer replacement plan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Replanning failed. Please try again."); }
    finally { setPlanning(false); }
  }

  if (loading) return <main className="min-h-[70vh] bg-[#f7f9fc] px-6 py-20"><div className="mx-auto max-w-xl rounded-[26px] border border-[#e5ebf2] bg-white p-8 text-center">Loading your trip…</div></main>;
  if (!itinerary) return <main className="min-h-[70vh] bg-[#f7f9fc] px-6 py-20"><div className="mx-auto max-w-xl rounded-[26px] border border-[#e5ebf2] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#10243e]">No active itinerary</h1><Link href="/plan-trip" className="mt-5 inline-flex rounded-xl bg-[#ffd447] px-5 py-3 text-sm font-extrabold">Open Trip Planner</Link></div></main>;

  return <main className="bg-[#f7f9fc] pb-20"><section className="border-b border-[#e4eaf1] bg-white"><div className="container-page py-10"><Link href="/itinerary" className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#66768c]"><ArrowLeft size={16}/> Back to itinerary</Link><div className="mt-5 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#f0d2d2] bg-[#fff6f6] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b54747]"><AlertTriangle size={12}/> Weather-aware replanning</div><h1 className="mt-4 text-[38px] font-black tracking-[-0.04em] text-[#10243e] sm:text-[48px]">Adapt the trip before weather changes the plan.</h1><p className="mt-3 text-[15px] leading-7 text-[#6d7c90]">TravelSetu compares the day's weather with the activity profile and asks AI for safer alternatives when conditions become risky.</p></div></div></section>
    <section className="container-page pt-8"><div className="grid gap-6 xl:grid-cols-[280px_1fr]"><aside className="space-y-3">{itinerary.days.map((day) => { const w = weather?.daily.find((x) => x.date === day.date); return <button key={day.day} onClick={() => setSelectedDay(day.day)} className={`w-full rounded-2xl border p-4 text-left ${selectedDay === day.day ? "border-[#0b63ce] bg-[#eef6ff]" : "border-[#e5ebf2] bg-white"}`}><div className="flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8a97a8]">Day {day.day}</span>{w?.risk === "AT RISK" ? <AlertTriangle size={15} className="text-[#b54747]"/> : w?.risk === "CAUTION" ? <Wind size={15} className="text-[#977100]"/> : <CheckCircle2 size={15} className="text-[#2c8650]"/>}</div><div className="mt-2 text-[14px] font-extrabold text-[#20364f]">{day.title}</div><div className="mt-1 text-[11px] text-[#8a97a8]">{w ? `${w.risk} · ${w.rainProbability}% rain` : "Weather loading…"}</div></button> })}</aside>
      <div className="space-y-6">{message && <div className="rounded-2xl border border-[#dceadf] bg-[#f3fbf5] px-4 py-3 text-[12px] font-bold text-[#327049]">{message}</div>}<div className="grid gap-6 lg:grid-cols-2"><PlanCard title="CURRENT PLAN" tone="blue" day={selectedItineraryDay}/><div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]"><Sparkles size={14}/> AI SUGGESTED PLAN</div>{selectedWeather?.risk === "AT RISK" ? <div className="mt-5 rounded-2xl border border-[#dbeaff] bg-[#f3f8ff] p-5"><div className="text-[16px] font-black text-[#20364f]">Ready to create safer alternatives</div><p className="mt-2 text-[12px] leading-5 text-[#66768c]">Current conditions: {selectedWeather.description}, {selectedWeather.rainProbability}% rain chance and {Math.round(selectedWeather.maxWindSpeed)} km/h max wind.</p><button onClick={replan} disabled={planning} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b63ce] px-5 py-3 text-[12px] font-extrabold text-white disabled:opacity-60">{planning ? <LoaderCircle size={15} className="animate-spin"/> : <Sparkles size={15}/>} {planning ? "Finding better alternatives…" : "Ask AI to replan"}</button></div> : <div className="mt-5 rounded-2xl bg-[#f5fbf6] p-5"><div className="text-[15px] font-black text-[#327049]">No high-risk trigger</div><p className="mt-2 text-[12px] leading-5 text-[#53657a]">TravelSetu considers this day suitable under the current thresholds. Replanning is available when the day becomes AT RISK.</p></div>}</div></div>
      <div className="grid gap-4 sm:grid-cols-3"><Info icon={<CloudRain size={16}/>} label="Rain probability" value={`${selectedWeather?.rainProbability ?? "—"}%`}/><Info icon={<Wind size={16}/>} label="Max wind" value={selectedWeather ? `${Math.round(selectedWeather.maxWindSpeed)} km/h` : "—"}/><Info icon={<MapPin size={16}/>} label="Estimated day cost" value={selectedItineraryDay ? formatINR(selectedItineraryDay.estimatedCost) : "—"}/></div></div></div></section>
  </main>;
}

function PlanCard({ title, day, tone }: { title: string; day?: Itinerary["days"][number]; tone: "blue" }) { return <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${tone === "blue" ? "text-[#0b63ce]" : "text-[#327049]"}`}>{title}</div>{day && <><div className="mt-4 text-[24px] font-black text-[#20364f]">{day.title}</div><div className="mt-4 space-y-3">{day.activities.map((item) => <div key={item.id} className="rounded-xl border border-[#eef2f6] bg-[#fbfcfe] p-3"><div className="text-[11px] font-extrabold text-[#8a97a8]">{item.time}</div><div className="mt-1 text-[13px] font-extrabold text-[#20364f]">{item.name}</div><div className="mt-1 text-[11px] text-[#66768c]">{item.location} · {item.safety}</div></div>)}</div></>}</div> }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-[#e5ebf2] bg-white p-4"><div className="flex items-center gap-2 text-[#0b63ce]">{icon}<span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8a97a8]">{label}</span></div><div className="mt-2 text-[16px] font-black text-[#20364f]">{value}</div></div> }
