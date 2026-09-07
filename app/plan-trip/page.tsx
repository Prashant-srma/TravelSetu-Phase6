"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, CircleHelp, MapPin, Sparkles, UsersRound, WalletCards } from "lucide-react";
import destinations from "@/data/destinations.json";
import { DEMO_TRIP, formatINR, getTripDuration, SAVED_TRIP_STORAGE_KEY, TRIP_STORAGE_KEY } from "@/lib/trip";
import type { FoodPreference, TransportPreference, TravelPreference, TripForm, TravelStyle } from "@/types/travel";

const interests: TravelPreference[] = ["Nature", "Adventure", "Beaches", "Culture", "Wildlife", "Spiritual", "Food", "Nightlife"];
const foods: FoodPreference[] = ["Any", "Vegetarian", "Non-Veg", "Vegan"];
const transports: TransportPreference[] = ["Any", "Train", "Bus", "Flight", "Car"];
const styles: TravelStyle[] = ["Relaxed", "Balanced", "Packed"];
const steps = ["Trip Details", "Preferences", "Additional Information", "Review & Save"];

export default function PlanTripPage() {
  const [step, setStep] = useState(0);
  const [trip, setTrip] = useState<TripForm>(DEMO_TRIP);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
      const saved = raw ? { ...DEMO_TRIP, ...JSON.parse(raw) } : DEMO_TRIP;
      const destinationFromUrl = new URLSearchParams(window.location.search).get("destination");
      setTrip(destinationFromUrl ? { ...saved, destination: destinations.some((d) => d.name.toLowerCase() === destinationFromUrl.toLowerCase()) ? destinationFromUrl : saved.destination } : saved);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
    setSaved(false);
  }, [trip]);

  const selectedDestination = useMemo(() => destinations.find((d) => d.name === trip.destination), [trip.destination]);
  const duration = getTripDuration(trip.startDate, trip.endDate);

  function update<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setTrip((current) => ({ ...current, [key]: value }));
  }

  function toggleInterest(value: TravelPreference) {
    setTrip((current) => ({ ...current, interests: current.interests.includes(value) ? current.interests.filter((item) => item !== value) : [...current.interests, value] }));
  }

  function next(event?: FormEvent) {
    event?.preventDefault();
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generateItinerary() {
    setGenerating(true);
    setGenerateError("");
    try {
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
      const response = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trip }),
      });
      const data = await response.json();
      if (!response.ok || !data.itinerary) throw new Error(data.error || "Could not generate itinerary");
      window.localStorage.setItem("travelsetu_itinerary", JSON.stringify(data.itinerary));
      window.localStorage.setItem("travelsetu_itinerary_source", data.source || "demo");
      window.localStorage.setItem("travelsetu_itinerary_message", data.message || "");
      window.location.href = "/itinerary";
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Unable to generate itinerary");
    } finally {
      setGenerating(false);
    }
  }

  function saveTrip() {
    try {
      const current = JSON.parse(window.localStorage.getItem(SAVED_TRIP_STORAGE_KEY) || "[]");
      const payload = { id: `trip-${Date.now()}`, createdAt: new Date().toISOString(), ...trip };
      window.localStorage.setItem(SAVED_TRIP_STORAGE_KEY, JSON.stringify([payload, ...current]));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main className="bg-[#f7f9fc] pb-20">
      <section className="border-b border-[#e7edf4] bg-white">
        <div className="container-page py-10 sm:py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#66768c] hover:text-[#0b63ce]"><ArrowLeft size={16} /> Back to home</Link>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">Plan your journey</div>
              <h1 className="mt-2 text-[38px] font-black tracking-[-0.04em] text-[#10243e] sm:text-[50px]">Build a trip around <span className="text-[#0b63ce]">you.</span></h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6d7c90]">Tell TravelSetu where you’re going, what you enjoy and how you like to travel. Your preferences are saved locally in this demo.</p>
            </div>
            <div className="rounded-2xl border border-[#e3eaf2] bg-[#f8fbff] px-5 py-4 text-left sm:min-w-[230px]">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8592a3]">Current selection</div>
              <div className="mt-1 text-[16px] font-extrabold text-[#10243e]">{trip.destination}</div>
              <div className="mt-1 text-[12px] text-[#66768c]">{duration || "—"} day{duration === 1 ? "" : "s"} • {trip.travellers} travellers</div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((label, index) => (
              <div key={label} className={`relative rounded-2xl border px-4 py-3 ${index === step ? "border-[#b8d5fb] bg-[#eef6ff]" : index < step ? "border-[#d8ebdc] bg-[#f2fbf3]" : "border-[#e7edf4] bg-white"}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-extrabold ${index === step ? "bg-[#0b63ce] text-white" : index < step ? "bg-[#2c9a55] text-white" : "bg-[#edf1f6] text-[#66768c]"}`}>{index < step ? <Check size={15} /> : index + 1}</span>
                  <span className={`text-[12px] font-extrabold ${index === step ? "text-[#0b63ce]" : "text-[#53657a]"}`}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pt-8">
        <form onSubmit={(event) => step === steps.length - 1 ? event.preventDefault() : next(event)} className="grid gap-6 xl:grid-cols-[1fr_330px]">
          <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(20,55,95,.06)] sm:p-8">
            {step === 0 && <StepDetails trip={trip} update={update} />}
            {step === 1 && <StepPreferences trip={trip} update={update} toggleInterest={toggleInterest} />}
            {step === 2 && <StepAdditional trip={trip} update={update} />}
            {step === 3 && <StepReview trip={trip} destination={selectedDestination} duration={duration} />}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf1f5] pt-6 sm:flex-row sm:justify-between">
              <button type="button" onClick={back} disabled={step === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe7ef] px-5 py-3 text-[13px] font-extrabold text-[#53657a] disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={16} /> Back</button>
              {step < steps.length - 1 ? (
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b63ce] px-6 py-3 text-[13px] font-extrabold text-white shadow-[0_10px_24px_rgba(11,99,206,.18)] hover:bg-[#074b9d]">Continue <ArrowRight size={16} /></button>
              ) : (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                  {generateError && <div className="w-full rounded-xl border border-[#f4caca] bg-[#fff5f5] px-4 py-3 text-[12px] font-bold text-[#a44242] sm:flex-1">{generateError}</div>}
                  <button type="button" onClick={saveTrip} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe7ef] bg-white px-5 py-3 text-[13px] font-extrabold text-[#53657a]">{saved ? <Check size={16} /> : <span>Save</span>} {saved ? "Trip Saved" : "Save Trip"}</button>
                  <button type="button" onClick={generateItinerary} disabled={generating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffd447] px-6 py-3 text-[13px] font-extrabold text-[#10243e] disabled:cursor-not-allowed disabled:opacity-65">{generating ? <span className="animate-spin">✦</span> : <Sparkles size={16} />} {generating ? "AI is planning…" : "Let AI plan the best itinerary for you"}</button>
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-[26px] border border-[#e5ebf2] bg-white p-5 shadow-[0_18px_45px_rgba(20,55,95,.06)] sm:p-6 xl:sticky xl:top-24">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">Trip snapshot</div>
            <div className="mt-4 rounded-2xl bg-[#f7faff] p-4">
              <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 text-[#0b63ce]" /><div><div className="text-[11px] font-bold text-[#8592a3]">Destination</div><div className="mt-1 text-[15px] font-extrabold text-[#10243e]">{trip.destination}</div></div></div>
              <div className="mt-4 flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 text-[#0b63ce]" /><div><div className="text-[11px] font-bold text-[#8592a3]">Dates</div><div className="mt-1 text-[13px] font-extrabold text-[#10243e]">{trip.startDate} → {trip.endDate}</div></div></div>
              <div className="mt-4 flex items-start gap-3"><UsersRound size={18} className="mt-0.5 text-[#0b63ce]" /><div><div className="text-[11px] font-bold text-[#8592a3]">Travellers</div><div className="mt-1 text-[13px] font-extrabold text-[#10243e]">{trip.travellers}</div></div></div>
              <div className="mt-4 flex items-start gap-3"><WalletCards size={18} className="mt-0.5 text-[#0b63ce]" /><div><div className="text-[11px] font-bold text-[#8592a3]">Budget</div><div className="mt-1 text-[13px] font-extrabold text-[#10243e]">{formatINR(trip.budget)}</div></div></div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f2e2a5] bg-[#fffbeb] p-4"><CircleHelp size={18} className="mt-0.5 text-[#ad8700]" /><p className="text-[12px] leading-5 text-[#7e6a1a]">Your planner is now connected to TravelSetu AI. Generate a structured itinerary from your preferences, budget and dates.</p></div>
          </aside>
        </form>
      </section>
    </main>
  );
}

function StepDetails({ trip, update }: { trip: TripForm; update: <K extends keyof TripForm>(key: K, value: TripForm[K]) => void }) {
  return <div><Header eyebrow="Step 1" title="Trip details" subtitle="Start with the basics. You can change these values anytime." />
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <Input label="From" value={trip.from} onChange={(e) => update("from", e.target.value)} placeholder="Delhi" />
      <label className="block"><span className="label">Destination</span><select value={trip.destination} onChange={(e) => update("destination", e.target.value)} className="input"><option value="">Select destination</option>{destinations.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.state}</option>)}</select></label>
      <Input label="Start date" type="date" value={trip.startDate} onChange={(e) => update("startDate", e.target.value)} />
      <Input label="End date" type="date" value={trip.endDate} onChange={(e) => update("endDate", e.target.value)} />
      <Input label="Travellers" type="number" min={1} max={20} value={trip.travellers} onChange={(e) => update("travellers", Math.max(1, Number(e.target.value)))} />
      <Input label="Total budget (₹)" type="number" min={0} step={500} value={trip.budget} onChange={(e) => update("budget", Math.max(0, Number(e.target.value)))} />
    </div>
  </div>;
}

function StepPreferences({ trip, update, toggleInterest }: { trip: TripForm; update: <K extends keyof TripForm>(key: K, value: TripForm[K]) => void; toggleInterest: (value: TravelPreference) => void }) {
  return <div><Header eyebrow="Step 2" title="Travel preferences" subtitle="Choose the things you want your trip to feel like." />
    <div className="mt-8"><div className="label">Interests</div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{interests.map((item) => <button key={item} type="button" onClick={() => toggleInterest(item)} className={`rounded-xl border px-4 py-3 text-left text-[13px] font-extrabold ${trip.interests.includes(item) ? "border-[#0b63ce] bg-[#eef6ff] text-[#0b63ce]" : "border-[#e2e8f0] text-[#53657a]"}`}>{trip.interests.includes(item) ? "✓ " : ""}{item}</button>)}</div></div>
    <div className="mt-8 grid gap-6 md:grid-cols-2"><RadioGroup label="Food preference" value={trip.foodPreference} options={foods} onChange={(value) => update("foodPreference", value as FoodPreference)} /><RadioGroup label="Transport preference" value={trip.transport} options={transports} onChange={(value) => update("transport", value as TransportPreference)} /></div>
  </div>;
}

function StepAdditional({ trip, update }: { trip: TripForm; update: <K extends keyof TripForm>(key: K, value: TripForm[K]) => void }) {
  return <div><Header eyebrow="Step 3" title="Additional information" subtitle="Fine-tune the trip before you save it." />
    <div className="mt-8 space-y-6"><RadioGroup label="Travel style" value={trip.travelStyle} options={styles} onChange={(value) => update("travelStyle", value as TravelStyle)} /><div className="grid gap-5 md:grid-cols-2"><label className="block"><span className="label">Accommodation preference</span><select value={trip.accommodationPreference} onChange={(e) => update("accommodationPreference", e.target.value)} className="input"><option>Comfortable stay</option><option>Budget stay</option><option>Hostel / homestay</option><option>Premium stay</option></select></label><Input label="Special requirements" value={trip.specialRequirements} onChange={(e) => update("specialRequirements", e.target.value)} placeholder="Accessibility, celebrations, dietary needs…" /></div></div>
  </div>;
}

function StepReview({ trip, destination, duration }: { trip: TripForm; destination: typeof destinations[number] | undefined; duration: number }) {
  return <div><Header eyebrow="Step 4" title="Review your trip" subtitle="Your choices are ready to be used by the next TravelSetu phases." />
    <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ebf2]"><div className="relative h-48 overflow-hidden"><img src={destination?.image} alt={destination?.name || "Destination"} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#071e38]/65 to-transparent" /><div className="absolute bottom-5 left-5 text-white"><div className="text-[11px] font-extrabold uppercase tracking-[0.16em]">Ready to travel</div><div className="mt-1 text-[26px] font-black">{trip.destination}</div></div></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Summary label="From" value={trip.from} /><Summary label="Dates" value={`${trip.startDate} → ${trip.endDate}`} /><Summary label="Duration" value={`${duration} day${duration === 1 ? "" : "s"}`} /><Summary label="Travellers" value={String(trip.travellers)} /><Summary label="Budget" value={formatINR(trip.budget)} /><Summary label="Travel style" value={trip.travelStyle} /><Summary label="Food" value={trip.foodPreference} /><Summary label="Transport" value={trip.transport} /></div><div className="border-t border-[#e9eef4] p-5"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8592a3]">Interests</div><div className="mt-3 flex flex-wrap gap-2">{trip.interests.map((item) => <span key={item} className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-[11px] font-extrabold text-[#0b63ce]">{item}</span>)}</div></div></div>
  </div>;
}

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <div><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0b63ce]">{eyebrow}</div><h2 className="mt-2 text-[30px] font-black tracking-[-0.035em] text-[#10243e]">{title}</h2><p className="mt-2 text-[14px] leading-6 text-[#6d7c90]">{subtitle}</p></div>; }
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="block"><span className="label">{label}</span><input {...props} className="input" /></label>; }
function RadioGroup({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <div><div className="label">{label}</div><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`rounded-xl border px-4 py-2.5 text-[12px] font-extrabold ${value === option ? "border-[#0b63ce] bg-[#eef6ff] text-[#0b63ce]" : "border-[#e2e8f0] bg-white text-[#53657a]"}`}>{option}</button>)}</div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f8fafc] p-3.5"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8592a3]">{label}</div><div className="mt-1 text-[13px] font-extrabold text-[#20364f]">{value}</div></div>; }
