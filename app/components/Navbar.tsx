"use client";

import Link from "next/link";
import { MapPinned, Menu, Search, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

const navItems: Array<{ href: string; label: string; icon?: LucideIcon }> = [
  { href: "/", label: "Home" },
  { href: "/plan-trip", label: "Plan Trip" },
  { href: "/explore", label: "Explore" },
  { href: "/my-trips", label: "My Trips" },
  { href: "/trip-map", label: "Trip Map", icon: MapPinned },
  { href: "/assistant", label: "Assistant" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-[78px] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0b63ce] text-white shadow-sm">
            <span className="text-lg font-black tracking-tight">TS</span>
          </span>
          <span>
            <span className="block text-[18px] font-extrabold tracking-[-0.02em] text-[#10243e]">TravelSetu</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a889b]">Explore • Plan • Travel • Safely</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#506176] transition hover:text-[#0b63ce]">
                {Icon && <Icon size={15} strokeWidth={2} />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button aria-label="Search" className="grid h-10 w-10 place-items-center rounded-xl text-[#607086] hover:bg-[#f3f7fb] hover:text-[#0b63ce]">
            <Search size={19} strokeWidth={2.1} />
          </button>
          <Link href="/login" className="grid h-10 w-10 place-items-center rounded-xl text-[#607086] hover:bg-[#f3f7fb] hover:text-[#0b63ce]">
            <UserRound size={19} strokeWidth={2.1} />
          </Link>
          <Link href="/login" className="px-3 text-[14px] font-semibold text-[#506176]">Login</Link>
          <Link href="/signup" className="rounded-xl bg-[#ffd447] px-5 py-2.5 text-[14px] font-extrabold text-[#13233a] shadow-sm transition hover:-translate-y-0.5">
            Sign Up
          </Link>
        </div>

        <button onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" className="grid h-11 w-11 place-items-center rounded-xl bg-[#f3f7fb] text-[#20344e] lg:hidden">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-[#334862] hover:bg-[#f3f7fb]">
                  {Icon && <Icon size={17} strokeWidth={2} />}
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-center text-[14px] font-bold text-[#334862]">Login</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl bg-[#ffd447] px-4 py-3 text-center text-[14px] font-extrabold text-[#13233a]">Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
