"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CloudRain, HeartPulse, LocateFixed, MapPin, Phone, ShieldCheck, Siren, Sparkles, UsersRound, Wind, X } from "lucide-react";
import emergency from "@/data/emergency.json";
import destinations from "@/data/destinations.json";
import type { WeatherResponse } from "@/lib/weather";
import type { Itinerary } from "@/lib/itinerary";

type LocationState = { latitude: number; longitude: number; accuracy?: number } | null;

export default function SafetyPage() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [location, setLocation] = useState<LocationState>(null);
  const [locationStatus, setLocationStatus] = useState("Location not shared");
  const [sosOpen, setSosOpen] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("travelsetu_itinerary");
      if (saved) setItinerary(JSON.parse(saved));
    } catch {}
  }, []);

  const destination = useMemo(() => {
    const name = itinerary?.destination || "Manali";
    return destinations.find((item) => item.name.toLowerCase() === name.toLowerCase()) || destinations[0];
  }, [itinerary]);

  useEffect(() => {
    const trip = (() => {
      try { return JSON.parse(localStorage.getItem("travelsetu_trip") || "null"); } catch { return null; }
    })();
    const startDate = trip?.startDate || itinerary?.startDate || new Date().toISOString().slice(0, 10);
    const endDate = trip?.endDate || itinerary?.endDate || startDate;
    fetch("/api/weather", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: destination.latitude, longitude: destination.longitude, location: destination.name, startDate, endDate }) })
      .then((r) => r.ok ? r.json() : null).then((data) => data && setWeather(data)).catch(() => {});
  }, [destination, itinerary]);

  const shareLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("Location is not supported by this browser"); return; }
    setLocationStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }); setLocationStatus("Live location ready"); },
      () => setLocationStatus("Location permission was not granted"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startHold = () => {
    setSosProgress(0);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - start) / 1500) * 100));
      setSosProgress(progress);
      if (progress >= 100) { stopHold(); setSosOpen(true); }
    }, 40);
  };

  const stopHold = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setSosProgress(0);
  };

  const topRisk = weather?.daily?.find((day) => day.risk !== "SAFE");

  return (
    <main className="bg-[#f7fafe] min-h-screen pb-20">
      <section className="container-page pt-12 sm:pt-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0ee] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#d84b3e]"><ShieldCheck size={15} /> Safety & SOS</div>
            <h1 className="mt-5 text-[42px] font-black tracking-[-0.045em] text-[#10243e] sm:text-[54px]">Travel with confidence.</h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#66768c]">Safety information, weather alerts, live location tools and emergency contacts in one place. Demo actions are clearly labelled and do not claim to send real emergency alerts.</p>
          </div>
          <div className="rounded-2xl border border-[#dfe8f1] bg-white px-5 py-4 shadow-sm"><div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7b8aa0]">Current destination</div><div className="mt-1 flex items-center gap-2 text-[18px] font-black text-[#20364f]"><MapPin size={19} className="text-[#0b63ce]" />{destination.name}</div></div>
        </div>
      </section>

      <section className="container-page mt-10 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-5">
          <div className={`rounded-[24px] border p-6 shadow-sm ${topRisk ? "border-[#f2d38b] bg-[#fffaf0]" : "border-[#dcebe2] bg-[#f6fcf8]"}`}>
            <div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${topRisk ? "bg-[#fff0cb] text-[#ad7210]" : "bg-[#e3f6ea] text-[#287947]"}`}>{topRisk ? <AlertTriangle size={22} /> : <CloudRain size={22} />}</span><div className="min-w-0"><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#6d7b8d]">Weather alert</div><h2 className="mt-1 text-[20px] font-black text-[#20364f]">{topRisk ? `${topRisk.date}: ${topRisk.risk}` : "No high-risk days detected"}</h2><p className="mt-1 text-[14px] leading-6 text-[#66768c]">{topRisk?.reason || weather?.message || "TravelSetu will compare your itinerary against the latest available weather data."}</p></div></div>
            {topRisk && <div className="mt-5 grid grid-cols-3 gap-3"><Mini label="Rain" value={`${Math.round(topRisk.rainProbability)}%`} icon={<CloudRain size={16} />} /><Mini label="Wind" value={`${Math.round(topRisk.maxWindSpeed)} km/h`} icon={<Wind size={16} />} /><Mini label="Status" value={topRisk.risk} icon={<AlertTriangle size={16} />} /></div>}
          </div>

          <div className="rounded-[24px] border border-[#e0e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4"><div><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#0b63ce]">Emergency response</div><h2 className="mt-2 text-[24px] font-black text-[#20364f]">SOS demo</h2><p className="mt-2 text-[14px] leading-6 text-[#66768c]">Press and hold for 1.5 seconds to open the confirmation actions.</p></div><Siren className="text-[#e14d43]" size={34} /></div>
            <div className="mt-6 flex flex-col items-center rounded-[22px] border border-[#f1dfdc] bg-[#fff8f7] py-7">
              <button onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} className="relative grid h-36 w-36 select-none touch-none place-items-center rounded-full bg-[#e55348] text-white shadow-[0_20px_50px_rgba(229,83,72,.28)] transition active:scale-95" aria-label="Press and hold the SOS button">{sosProgress > 0 && <span className="absolute inset-1 rounded-full border-[6px] border-white/70" style={{ clipPath: `inset(${100 - sosProgress}% 0 0 0)` }} />}<span className="text-[23px] font-black">SOS</span></button>
              <div className="mt-4 text-[12px] font-bold text-[#a35b55]">Demo only — no real emergency alert is sent</div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#e0e8f0] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf3ff] text-[#0b63ce]"><LocateFixed size={19} /></span><div><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#7b8aa0]">Live location</div><div className="mt-1 text-[18px] font-black text-[#20364f]">{locationStatus}</div></div></div>{location && <div className="mt-4 rounded-xl bg-[#f6f9fd] px-4 py-3 text-[12px] font-semibold text-[#53667c]">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} · ±{Math.round(location.accuracy || 0)}m</div>}<button onClick={shareLocation} className="mt-4 w-full rounded-xl bg-[#0b63ce] px-4 py-3 text-[13px] font-extrabold text-white">{location ? "Refresh Location" : "Share Location"}</button></div>
            <div className="rounded-[24px] border border-[#e0e8f0] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7ef] text-[#2a8750]"><HeartPulse size={19} /></span><div><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#7b8aa0]">Nearby safe places</div><div className="mt-1 text-[18px] font-black text-[#20364f]">Use your map</div></div></div><p className="mt-3 text-[13px] leading-6 text-[#66768c]">Open Trip Map to locate the nearest hospitals, fuel stations and transport points from your itinerary.</p><a href="/trip-map" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9e5f0] px-4 py-3 text-[13px] font-extrabold text-[#20364f]">Open Trip Map <MapPin size={16} /></a></div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[24px] border border-[#e0e8f0] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff4d6] text-[#b47908]"><UsersRound size={19} /></span><div><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#7b8aa0]">Emergency contacts</div><div className="mt-1 text-[19px] font-black text-[#20364f]">Quick dial</div></div></div><div className="mt-5 space-y-3">{emergency.map((item) => <a key={item.id} href={`tel:${item.number}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#e7edf3] px-4 py-3 transition hover:border-[#b9d4f4] hover:bg-[#f7fbff]"><div><div className="text-[13px] font-extrabold text-[#20364f]">{item.name}</div><div className="text-[11px] text-[#7b8aa0]">{item.description}</div></div><span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf3ff] px-2.5 py-2 text-[12px] font-black text-[#0b63ce]"><Phone size={14} />{item.number}</span></a>)}</div></div>
          <div className="rounded-[24px] border border-[#e0e8f0] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8f0] text-[#2f7c4b]"><Sparkles size={19} /></span><div><div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#7b8aa0]">Safety tips</div><div className="mt-1 text-[19px] font-black text-[#20364f]">Before you go</div></div></div><div className="mt-5 space-y-3">{(destination.safetyTips || []).slice(0, 5).map((tip: string) => <div key={tip} className="flex gap-3 rounded-xl bg-[#f7fafc] p-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#2f7c4b]" /><span className="text-[12px] font-semibold leading-5 text-[#52657b]">{tip}</span></div>)}</div></div>
        </aside>
      </section>

      {sosOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0d1b2acc] p-5"><div className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-[#fff0ee] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#d84b3e]"><Siren size={13} /> Emergency alert ready</div><h2 className="mt-4 text-[28px] font-black text-[#10243e]">Choose a demo action</h2></div><button onClick={() => setSosOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-[#f3f7fb] text-[#62748a]"><X size={18} /></button></div><p className="mt-3 text-[14px] leading-6 text-[#66768c]">No emergency alert has been sent. Choose what you want to simulate.</p><div className="mt-6 grid gap-3"><button onClick={() => { setSosOpen(false); shareLocation(); }} className="flex items-center gap-3 rounded-xl border border-[#dfe7ef] px-4 py-3 text-left"><LocateFixed className="text-[#0b63ce]" size={18} /><div><div className="text-[13px] font-extrabold text-[#20364f]">Share Location</div><div className="text-[11px] text-[#7b8aa0]">Prepare your current coordinates for sharing</div></div></button><button onClick={() => setSosOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#dfe7ef] px-4 py-3 text-left"><UsersRound className="text-[#0b63ce]" size={18} /><div><div className="text-[13px] font-extrabold text-[#20364f]">Notify Emergency Contact</div><div className="text-[11px] text-[#7b8aa0]">Demo action — no message is sent</div></div></button><button onClick={() => setSosOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#dfe7ef] px-4 py-3 text-left"><Phone className="text-[#0b63ce]" size={18} /><div><div className="text-[13px] font-extrabold text-[#20364f]">Contact Local Emergency Services</div><div className="text-[11px] text-[#7b8aa0]">Use the emergency numbers shown on this page</div></div></button></div></div></div>}
    </main>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl bg-white/80 px-3 py-3"><div className="flex items-center gap-2 text-[11px] font-bold text-[#75869a]">{icon}{label}</div><div className="mt-1 text-[15px] font-black text-[#243a52]">{value}</div></div>; }
