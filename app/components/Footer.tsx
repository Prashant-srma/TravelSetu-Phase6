import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#0f2744] text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#ffd447] text-[#10243e]">
              <span className="text-lg font-black">TS</span>
            </span>
            <div>
              <div className="text-[18px] font-extrabold">TravelSetu</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/55">Travel Smarter. Travel Safer.</div>
            </div>
          </div>
          <p className="mt-5 max-w-md text-[14px] leading-6 text-white/70">AI-powered travel planning that brings your itinerary, budget, weather, map and safety tools together in one polished journey.</p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Twitter, Linkedin].map((Icon) => (
              <button key={Icon.displayName ?? Icon.name} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10">
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-white/50">Navigation</div>
          <div className="mt-4 space-y-3 text-[14px] text-white/75">
            <Link className="block hover:text-white" href="/plan-trip">Plan Trip</Link>
            <Link className="block hover:text-white" href="/explore">Explore</Link>
            <Link className="block hover:text-white" href="/my-trips">My Trips</Link>
            <Link className="block hover:text-white" href="/safety">Safety</Link>
          </div>
        </div>
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-white/50">TravelSetu</div>
          <div className="mt-4 space-y-3 text-[14px] text-white/75">
            <Link className="block hover:text-white" href="/about">About</Link>
            <span className="block">Privacy Policy</span>
            <span className="block">Terms of Service</span>
            <span className="block">Travel Responsibly</span>
            <span className="block">A Greener Tomorrow</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} TravelSetu. Built for Smart India Hackathon.</span>
          <span>Explore • Plan • Travel • Safely</span>
        </div>
      </div>
    </footer>
  );
}
