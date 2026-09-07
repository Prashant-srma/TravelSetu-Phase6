"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, CloudRain, Download, MapPin, MapPinned, RefreshCw, Share2, ShieldCheck, Sparkles, Thermometer, WalletCards, Wind } from "lucide-react";
import type { Itinerary, ItineraryDay } from "@/lib/itinerary";
import { formatINR } from "@/lib/trip";
import type { WeatherResponse, WeatherRisk } from "@/lib/weather";

const ITINERARY_KEY = "travelsetu_itinerary";
const SOURCE_KEY = "travelsetu_itinerary_source";
const MESSAGE_KEY = "travelsetu_itinerary_message";
const TRIP_KEY = "travelsetu_trip";

type RiskDay = WeatherResponse["daily"][number];

export default function ItineraryPage() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherNotice, setWeatherNotice] = useState("");
  const [notice, setNotice] = useState("");
  const [replanning, setReplanning] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ITINERARY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Itinerary;
        setItinerary(parsed);
        setActiveDay(parsed.days[0]?.day || 1);
        const sourceMessage = localStorage.getItem(MESSAGE_KEY) || "";
        const source = localStorage.getItem(SOURCE_KEY) || "";
        if (sourceMessage) setNotice(sourceMessage);
        else if (source === "demo" || source === "fallback") setNotice("This itinerary is currently using TravelSetu demo/fallback data. You can still test weather risk and replanning.");
      }
    } catch { setNotice("We could not read your saved itinerary. Generate a new one from the planner."); }
  }, []);

  useEffect(() => {
    if (!itinerary) return;
    let cancelled = false;
    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherNotice("");
      try {
        const response = await fetch("/api/weather", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: itinerary?.destination, startDate: itinerary?.startDate, endDate: itinerary?.endDate }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load weather");
        if (!cancelled) { setWeather(data as WeatherResponse); if (data.message) setWeatherNotice(data.message); }
      } catch (error) {
        if (!cancelled) setWeatherNotice(error instanceof Error ? error.message : "Weather service is temporarily unavailable. Showing demo weather data.");
      } finally { if (!cancelled) setWeatherLoading(false); }
    }
    loadWeather();
    return () => { cancelled = true; };
  }, [itinerary]);

  const day = useMemo(() => itinerary?.days.find((item) => item.day === activeDay) || itinerary?.days[0], [itinerary, activeDay]);
  const dayWeather = weather?.daily.find((item) => item.date === day?.date);

  async function shareTrip() {
    if (!itinerary) return;
    const shareText = `TravelSetu itinerary — ${itinerary.destination} · ${itinerary.duration} days · ${formatINR(itinerary.estimatedCost)}`;
    try { if (navigator.share) await navigator.share({ title: `TravelSetu — ${itinerary.destination}`, text: shareText }); else await navigator.clipboard.writeText(shareText); setNotice("Trip details ready to share."); } catch {}
  }

  function downloadJson() {
    if (!itinerary) return;
    const payload = { itinerary, weather };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${itinerary.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-travelsetu-itinerary.json`; a.click(); URL.revokeObjectURL(url);
  }

  async function replanDay() {
    if (!itinerary || !day || !dayWeather || dayWeather.risk !== "AT RISK") return;
    setReplanning(true);
    try {
      const tripRaw = localStorage.getItem(TRIP_KEY);
      const trip = tripRaw ? JSON.parse(tripRaw) : { from: itinerary.from, destination: itinerary.destination, startDate: itinerary.startDate, endDate: itinerary.endDate, travellers: itinerary.travellers, budget: itinerary.estimatedCost, interests: [], foodPreference: "Any", transport: "Any", travelStyle: "Balanced", accommodationPreference: "Comfortable stay", specialRequirements: "" };
      const response = await fetch("/api/replan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trip, day: day.day, weatherDay: dayWeather, affectedActivity: day.activities.find((item) => item.type === "activity") || day.activities[0] }) });
      const data = await response.json();
      if (!response.ok || !data.replacement) throw new Error(data.error || "Could not replan the day");
      localStorage.setItem(ITINERARY_KEY, JSON.stringify(data.replacement));
      localStorage.setItem(SOURCE_KEY, data.source || "fallback");
      localStorage.setItem(MESSAGE_KEY, data.reason || "TravelSetu updated the day using a weather-safe alternative plan.");
      setItinerary(data.replacement as Itinerary); setActiveDay(day.day); setNotice(data.reason || "Day replanned successfully.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "We could not replan this day right now."); }
    finally { setReplanning(false); }
  }

  if (!itinerary || !day) return <main className="min-h-[70vh] bg-[#f7f9fc] px-6 py-20"><div className="mx-auto max-w-2xl rounded-[28px] border border-[#e5ebf2] bg-white p-10 text-center shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6ff] text-[#0b63ce]"><Sparkles size={24}/></div><h1 className="mt-5 text-[30px] font-black text-[#10243e]">Your AI itinerary is waiting</h1><p className="mx-auto mt-3 max-w-lg text-[14px] leading-6 text-[#6d7c90]">Generate a personalized itinerary from the Trip Planner. TravelSetu will then check weather conditions for each day.</p><Link href="/plan-trip" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ffd447] px-6 py-3 text-[13px] font-extrabold text-[#10243e]">Open Trip Planner <ArrowLeft className="rotate-180" size={16}/></Link></div></main>;

  const riskyDays = weather?.daily.filter((item) => item.risk === "AT RISK") || [];

  return <main className="bg-[#f7f9fc] pb-20">
    <section className="border-b border-[#e4eaf1] bg-white"><div className="container-page py-10 sm:py-12">
      <Link href="/plan-trip" className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#66768c] hover:text-[#0b63ce]"><ArrowLeft size={16}/> Edit Trip</Link>
      <div className="mt-5 flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#dcecff] bg-[#f2f8ff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]"><Sparkles size={12}/> AI itinerary + live weather</div><h1 className="mt-4 text-[38px] font-black tracking-[-0.04em] text-[#10243e] sm:text-[50px]">Your AI-Powered Itinerary <span className="text-[#0b63ce]">is Ready!</span></h1><p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#6d7c90]">{itinerary.tripSummary}</p></div><div className="flex flex-wrap gap-2"><Link href="/trip-map" className="inline-flex items-center gap-2 rounded-xl border border-[#cfe3ff] bg-[#f3f8ff] px-4 py-3 text-[12px] font-extrabold text-[#0b63ce] transition hover:-translate-y-0.5"><MapPinned size={15}/> Trip Map</Link><button onClick={shareTrip} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe7ef] bg-white px-4 py-3 text-[12px] font-extrabold text-[#53657a]"><Share2 size={15}/> Share Trip</button><button onClick={downloadJson} className="inline-flex items-center gap-2 rounded-xl bg-[#0b63ce] px-4 py-3 text-[12px] font-extrabold text-white"><Download size={15}/> Download</button></div></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<CalendarDays size={17}/>} label="Duration" value={`${itinerary.duration} days`} /><Stat icon={<span className="text-[14px] font-black">3</span>} label="Travellers" value={String(itinerary.travellers)} /><Stat icon={<WalletCards size={17}/>} label="Estimated Cost" value={formatINR(itinerary.estimatedCost)} /><Stat icon={<MapPin size={17}/>} label="Destination" value={itinerary.destination} /></div>
      {notice && <div className="mt-5 rounded-2xl border border-[#dceadf] bg-[#f3fbf5] px-4 py-3 text-[12px] font-bold text-[#327049]">{notice}</div>}
    </div></section>

    <section className="container-page pt-8">
      <WeatherBanner weather={weather} loading={weatherLoading} notice={weatherNotice} riskyDays={riskyDays} />
      <div className="mt-6 mb-6 flex gap-2 overflow-x-auto pb-1">{itinerary.days.map((item) => { const w = weather?.daily.find((x) => x.date === item.date); return <button key={item.day} onClick={() => setActiveDay(item.day)} className={`relative shrink-0 rounded-xl border px-4 py-3 text-[12px] font-extrabold ${activeDay === item.day ? "border-[#0b63ce] bg-[#0b63ce] text-white" : "border-[#e2e8f0] bg-white text-[#53657a]"}`}>Day {item.day}{w?.risk === "AT RISK" && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#dc5555]" />}{w?.risk === "CAUTION" && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e4b52f]" />}</button>; })}</div>
      <div className="grid gap-6 xl:grid-cols-[1fr_330px]"><section className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)] sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]">{formatDay(day.date)} · Day {day.day}</div><h2 className="mt-2 text-[28px] font-black tracking-[-0.03em] text-[#10243e]">{day.title}</h2><p className="mt-2 text-[13px] leading-6 text-[#6d7c90]">{day.summary}</p></div><div className="rounded-xl bg-[#fff9dd] px-3 py-2 text-[12px] font-extrabold text-[#8b6f00]">{formatINR(day.estimatedCost)}</div></div>
        {dayWeather && <div className={`mt-5 rounded-2xl border p-4 ${riskBox(dayWeather.risk)}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-[12px] font-extrabold"><RiskIcon risk={dayWeather.risk}/> {dayWeather.risk} DAY</div><p className="mt-1 text-[12px] leading-5">{dayWeather.reason || `${dayWeather.description}. Check conditions before outdoor activities.`}</p></div>{dayWeather.risk === "AT RISK" && <button disabled={replanning} onClick={replanDay} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10243e] px-4 py-2.5 text-[12px] font-extrabold text-white disabled:opacity-60">{replanning ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>} {replanning ? "Finding safer options…" : "Replan this day"}</button>}</div></div>}
        <div className="mt-8 space-y-0">{day.activities.map((item, index) => <Activity key={item.id} item={item} last={index === day.activities.length - 1} dayRisk={dayWeather?.risk} />)}</div>
      </section>
      <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit"><WeatherCard weather={dayWeather} loading={weatherLoading}/><div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]">Trip overview</div><div className="mt-4 space-y-3"><Mini label="From" value={itinerary.from}/><Mini label="Dates" value={`${itinerary.startDate} → ${itinerary.endDate}`}/><Mini label="Budget used" value={formatINR(itinerary.estimatedCost)}/></div></div><div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="flex items-center justify-between"><div><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]">AI planning notes</div><div className="mt-1 text-[13px] font-bold text-[#53657a]">Packing & tips</div></div><RefreshCw size={17} className="text-[#8b9bad]"/></div><div className="mt-5 space-y-3">{itinerary.packingSuggestions.slice(0,5).map((item) => <div key={item} className="flex gap-2 text-[12px] leading-5 text-[#53657a]"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2c9a55]"/>{item}</div>)}</div></div><div className="space-y-3"><Link href="/trip-map" className="block rounded-[26px] border border-[#dbeaff] bg-[#f3f8ff] p-6 transition hover:-translate-y-0.5"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]"><MapPinned size={15}/> Trip Map</div><p className="mt-2 text-[12px] leading-5 text-[#53657a]">See your itinerary stops, route, hotels, restaurants and nearby places on the interactive map.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b63ce] px-3 py-2 text-[11px] font-extrabold text-white">Open Trip Map <ArrowLeft size={14} className="rotate-180"/></span></Link><Link href="/replanning" className="block rounded-[26px] border border-[#dbeaff] bg-[#f3f8ff] p-6 transition hover:-translate-y-0.5"><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]">Dynamic replanning</div><p className="mt-2 text-[12px] leading-5 text-[#53657a]">Open the weather-aware replanning workspace to compare the current plan with AI-suggested alternatives.</p></Link></div></aside></div>
    </section>
  </main>;
}

function WeatherBanner({ weather, loading, notice, riskyDays }: { weather: WeatherResponse | null; loading: boolean; notice: string; riskyDays: RiskDay[] }) { if (loading) return <div className="rounded-[24px] border border-[#dcecff] bg-[#f3f8ff] p-5 text-[12px] font-bold text-[#53657a]">Checking weather…</div>; if (!weather) return <div className="rounded-[24px] border border-[#f1e1b7] bg-[#fffaf0] p-5 text-[12px] font-bold text-[#7e6a1a]">Weather data is unavailable. The itinerary remains usable with demo risk handling.</div>; return <div className={`rounded-[24px] border p-5 ${riskyDays.length ? "border-[#f0c6c6] bg-[#fff6f6]" : "border-[#dceadf] bg-[#f5fbf6]"}`}><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-[12px] font-extrabold text-[#20364f]"><CloudRain size={16} className="text-[#0b63ce]"/> {weather.source === "historical-forecast" ? "HISTORICAL WEATHER" : "LIVE WEATHER"} · {weather.location}</div><p className="mt-1 text-[12px] leading-5 text-[#66768c]">{riskyDays.length ? `${riskyDays.length} day${riskyDays.length > 1 ? "s" : ""} may need a safer plan.` : "No high-risk days detected by the current TravelSetu thresholds."} {notice}</p></div><div className="flex flex-wrap gap-2">{weather.daily.map((d) => <span key={d.date} className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${pillRisk(d.risk)}`}>{formatShortDate(d.date)} · {d.risk}</span>)}</div></div></div> }

function WeatherCard({ weather, loading }: { weather?: RiskDay; loading: boolean }) { return <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)]">{loading ? <div className="text-[12px] font-bold text-[#6d7c90]">Checking weather…</div> : !weather ? <div className="text-[12px] font-bold text-[#6d7c90]">Weather unavailable</div> : <><div className="flex items-center justify-between"><div><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0b63ce]">Live Weather</div><div className="mt-1 text-[18px] font-black text-[#20364f]">{weather.description}</div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${pillRisk(weather.risk)}`}>{weather.risk}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><WeatherMetric icon={<Thermometer size={15}/>} label="Temperature" value={`${weather.minTemperature}°–${weather.maxTemperature}°C`}/><WeatherMetric icon={<CloudRain size={15}/>} label="Rain chance" value={`${weather.rainProbability}%`}/><WeatherMetric icon={<Wind size={15}/>} label="Max wind" value={`${Math.round(weather.maxWindSpeed)} km/h`}/><WeatherMetric icon={<ShieldCheck size={15}/>} label="Humidity" value={`${weather.humidity}%`}/></div>{weather.reason && <div className="mt-4 rounded-xl bg-[#f8fafc] p-3 text-[11px] leading-5 text-[#66768c]">{weather.reason}</div>}</>}</div> }
function WeatherMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl border border-[#eef2f6] bg-[#fbfcfe] p-3"><div className="flex items-center gap-1.5 text-[#0b63ce]">{icon}<span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8a97a8]">{label}</span></div><div className="mt-2 text-[11px] font-extrabold text-[#20364f]">{value}</div></div> }
function Activity({ item, last, dayRisk }: { item: ItineraryDay["activities"][number]; last: boolean; dayRisk?: WeatherRisk }) { const riskyOutdoor = dayRisk === "AT RISK" && (item.type === "activity" || item.type === "free-time"); const effective = riskyOutdoor ? "AT RISK" : dayRisk === "CAUTION" && item.type === "activity" ? "CAUTION" : item.safety; const tone = effective === "SAFE" ? "text-[#2c9a55] bg-[#edf9f0]" : effective === "CAUTION" ? "text-[#a27700] bg-[#fff7d9]" : "text-[#b54747] bg-[#fff1f1]"; return <div className="grid grid-cols-[82px_18px_1fr] gap-3"><div className="pt-1 text-[12px] font-extrabold text-[#6d7c90]">{item.time}</div><div className="relative flex justify-center"><span className={`mt-1.5 h-3 w-3 rounded-full ${effective === "AT RISK" ? "bg-[#d75555]" : effective === "CAUTION" ? "bg-[#e3b22e]" : "bg-[#0b63ce]"} ring-4 ring-[#eaf3ff]`}/>{!last && <span className="absolute left-1/2 top-5 h-[calc(100%-4px)] w-px -translate-x-1/2 bg-[#dbe4ee]"/>}</div><div className="pb-7"><div className="rounded-2xl border border-[#e5ebf2] bg-white p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><div className="text-[16px] font-extrabold text-[#20364f]">{item.name}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#8a97a8]"><span className="inline-flex items-center gap-1"><MapPin size={12}/>{item.location}</span><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{item.durationMinutes} min</span></div></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold ${tone}`}>{effective}</span></div><p className="mt-3 text-[12px] leading-5 text-[#66768c]">{riskyOutdoor ? "Outdoor conditions may be unsafe. TravelSetu recommends replanning this activity." : item.description}</p><div className="mt-3 text-[12px] font-extrabold text-[#0b63ce]">{formatINR(item.estimatedCost)}</div></div></div></div> }
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-[#e5ebf2] bg-white p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef6ff] text-[#0b63ce]">{icon}</div><div><div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a97a8]">{label}</div><div className="mt-0.5 text-[14px] font-extrabold text-[#20364f]">{value}</div></div></div> }
function Mini({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 rounded-xl bg-[#f8fafc] p-3"><span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8a97a8]">{label}</span><span className="text-right text-[12px] font-extrabold text-[#20364f]">{value}</span></div> }
function RiskIcon({ risk }: { risk: WeatherRisk }) { return risk === "AT RISK" ? <AlertTriangle size={15}/> : risk === "CAUTION" ? <Wind size={15}/> : <ShieldCheck size={15}/> }
function pillRisk(risk: WeatherRisk) { return risk === "AT RISK" ? "bg-[#ffe5e5] text-[#b54747]" : risk === "CAUTION" ? "bg-[#fff4c7] text-[#977100]" : "bg-[#e9f7ed] text-[#2c8650]"; }
function riskBox(risk: WeatherRisk) { return risk === "AT RISK" ? "border-[#f2c9c9] bg-[#fff6f6] text-[#9c4545]" : risk === "CAUTION" ? "border-[#efdf9e] bg-[#fffaf0] text-[#8a6b14]" : "border-[#d7eadb] bg-[#f5fbf6] text-[#327049]"; }
function formatDay(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function formatShortDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
