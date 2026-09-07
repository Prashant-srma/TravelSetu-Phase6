"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BusFront, ChevronRight, Fuel, Hotel, Landmark, MapPin, Navigation, RefreshCw, Route, Search, Hospital, Sparkles, Utensils, Clock3, WalletCards } from "lucide-react";
import destinations from "@/data/destinations.json";
import hotels from "@/data/hotels.json";
import restaurants from "@/data/restaurants.json";
import activities from "@/data/activities.json";
import type { Itinerary } from "@/lib/itinerary";
import type { MapCategory, MapPoint } from "@/app/components/TripMap";
import { formatINR } from "@/lib/trip";

const TripMap = dynamic(() => import("@/app/components/TripMap"), { ssr: false, loading: () => <div className="grid h-full min-h-[520px] place-items-center rounded-[28px] border border-[#dfe8f1] bg-[#eef4f8] text-[12px] font-extrabold text-[#66768c]">Loading interactive map…</div> });

const ITINERARY_KEY = "travelsetu_itinerary";
const CATEGORIES: { id: MapCategory; label: string; icon: React.ReactNode }[] = [
  { id: "hotel", label: "Hotels", icon: <Hotel size={15}/> },
  { id: "restaurant", label: "Restaurants", icon: <Utensils size={15}/> },
  { id: "attraction", label: "Attractions", icon: <Landmark size={15}/> },
  { id: "transport", label: "Transport", icon: <BusFront size={15}/> },
  { id: "hospital", label: "Hospitals", icon: <Hospital size={15}/> },
  { id: "fuel", label: "Fuel", icon: <Fuel size={15}/> },
];

type DestinationJson = typeof destinations[number];

const offsets: Record<string, [number, number][]> = {
  manali: [[0.020,0.018],[0.006,-0.022],[-0.018,0.020],[-0.028,-0.014],[0.030,-0.030]],
  goa: [[0.015,0.015],[-0.010,0.028],[0.020,-0.024],[-0.022,-0.018],[0.032,0.012]],
  rishikesh: [[0.014,0.018],[-0.012,0.022],[0.018,-0.020],[-0.020,-0.016],[0.026,-0.030]],
  udaipur: [[0.016,0.018],[-0.012,0.025],[0.020,-0.020],[-0.024,-0.014],[0.030,-0.030]],
  munnar: [[0.014,0.016],[-0.012,0.022],[0.017,-0.018],[-0.018,-0.014],[0.026,-0.026]],
  default: [[0.014,0.016],[-0.012,0.022],[0.018,-0.020],[-0.020,-0.014],[0.028,-0.028]],
};

const safePlaces: Record<string, {name: string; category: MapCategory; subtitle: string; detail: string}[]> = {
  default: [
    {name:"District Hospital", category:"hospital", subtitle:"Emergency support", detail:"Demo location for trip-safety planning. Verify the nearest live facility before travel."},
    {name:"Central Fuel Point", category:"fuel", subtitle:"Fuel station", detail:"Demo map point for trip planning."},
  ],
};

function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g,"-"); }
function haversine(a: MapPoint, b: MapPoint) {
  const r=6371, rad=(n:number)=>n*Math.PI/180; const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng); const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2; return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function prettyTime(minutes:number) { const h=Math.floor(minutes/60), m=Math.round(minutes%60); return h ? `${h}h ${m}m` : `${m}m`; }
function categoryTitle(c: MapCategory) { return c.charAt(0).toUpperCase()+c.slice(1); }

export default function TripMapPage() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<MapCategory[]>(CATEGORIES.map((item) => item.id));
  const [selectedId, setSelectedId] = useState("");
  const [mapMode, setMapMode] = useState<"route"|"discover">("route");
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const raw=localStorage.getItem(ITINERARY_KEY); if(raw) setItinerary(JSON.parse(raw) as Itinerary);
    } catch { setStatus("Saved itinerary could not be read. Using destination demo map."); }
  }, []);

  const destination = useMemo<DestinationJson>(() => {
    const wanted = itinerary?.destination?.toLowerCase();
    return (destinations as DestinationJson[]).find((d)=>d.name.toLowerCase()===wanted) || (destinations as DestinationJson[])[0];
  }, [itinerary]);

  const points = useMemo<MapPoint[]>(() => {
    const os=offsets[destination.id] || offsets.default;
    const list: MapPoint[]=[];
    const firstRouteNames=(itinerary?.days.flatMap(d=>d.activities).filter(a=>a.type === "activity" || a.type === "food").slice(0,5) || []).map(a=>a.name);
    list.push({id:`destination-${destination.id}`,name:destination.name,category:"destination",lat:destination.latitude,lng:destination.longitude,subtitle:destination.state,detail:destination.description,routeOrder:1});
    firstRouteNames.forEach((name,index)=>{
      const match=(activities as any[]).find((a)=>a.destinationId===destination.id && (name.toLowerCase().includes(String(a.name).toLowerCase()) || String(a.name).toLowerCase().includes(name.toLowerCase())));
      const [dLat,dLng]=os[index%os.length];
      list.push({id:`route-${index}-${slug(name)}`,name,category:"attraction",lat:destination.latitude+dLat,lng:destination.longitude+dLng,subtitle:"Itinerary stop",detail:match?.description || "Planned stop from your TravelSetu itinerary.",routeOrder:index+2});
    });
    if(firstRouteNames.length<3){
      destination.activities.slice(0,3-firstRouteNames.length).forEach((name,index)=>{ const n=firstRouteNames.length+index; const [dLat,dLng]=os[n%os.length]; list.push({id:`extra-${slug(name)}`,name,category:"attraction",lat:destination.latitude+dLat,lng:destination.longitude+dLng,subtitle:"Popular attraction",detail:"Popular demo destination activity.",routeOrder:n+2}); });
    }
    (hotels as any[]).filter(h=>h.destinationId===destination.id).slice(0,5).forEach((hotel,index)=>{const [dLat,dLng]=os[index]; list.push({id:hotel.id,name:hotel.name,category:"hotel",lat:destination.latitude+dLat*0.70,lng:destination.longitude+dLng*0.70,subtitle:`${hotel.type} · ${formatINR(hotel.pricePerNight)}/night`,detail:`${hotel.area} · ${hotel.rating}/5 demo rating`});});
    (restaurants as any[]).filter(r=>r.destinationId===destination.id).slice(0,5).forEach((restaurant,index)=>{const [dLat,dLng]=os[(index+2)%os.length]; list.push({id:restaurant.id,name:restaurant.name,category:"restaurant",lat:destination.latitude+dLat*1.05,lng:destination.longitude+dLng*1.05,subtitle:`${restaurant.cuisine} · ${formatINR(restaurant.averageCost)}/person`,detail:`Popular: ${restaurant.popularDishes.join(", ")}`});});
    const extras=safePlaces.default; extras.forEach((extra,index)=>{const [dLat,dLng]=os[(index+3)%os.length]; list.push({id:`${extra.category}-${destination.id}`,name:extra.name,category:extra.category,lat:destination.latitude+dLat*1.5,lng:destination.longitude+dLng*1.5,subtitle:extra.subtitle,detail:extra.detail});});
    list.push(...(itinerary ? [{id:`transport-${destination.id}`,name:`${destination.name} Transport Hub`,category:"transport" as const,lat:destination.latitude-0.014,lng:destination.longitude-0.018,subtitle:"Bus / taxi / transfer",detail:"Demo transport point. Live schedules and fares should be checked before booking."}] : []));
    return list;
  }, [destination, itinerary]);

  const route = useMemo(()=>points.filter(p=>p.routeOrder).sort((a,b)=>(a.routeOrder||0)-(b.routeOrder||0)),[points]);
  const filtered = useMemo(()=>points.filter(p=>p.category==="destination" || selectedCategories.includes(p.category)).filter(p=>!search || `${p.name} ${p.subtitle} ${p.category}`.toLowerCase().includes(search.toLowerCase())),[points,selectedCategories,search]);
  const routeDistance=useMemo(()=>route.slice(1).reduce((sum,p,i)=>sum+haversine(route[i],p),0),[route]);
  const travelMinutes=Math.round((routeDistance/32)*60);
  const transportCost=Math.round(routeDistance*16);

  function toggleCategory(category:MapCategory){setSelectedCategories((prev)=>prev.includes(category)?prev.filter(x=>x!==category):[...prev,category]);}
  function resetMap(){setSearch("");setSelectedCategories(CATEGORIES.map((item)=>item.id));setSelectedId("");setStatus("Map filters reset.");}

  return <main className="min-h-[calc(100vh-80px)] bg-[#f7f9fc] pb-16">
    <section className="border-b border-[#e4eaf1] bg-white"><div className="container-page py-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div>
        <Link href="/itinerary" className="inline-flex items-center gap-2 text-[12px] font-extrabold text-[#6d7c90] hover:text-[#0b63ce]"><ArrowLeft size={15}/> Back to itinerary</Link>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dcecff] bg-[#f2f8ff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b63ce]"><Navigation size={12}/> Interactive trip map</div>
        <h1 className="mt-3 text-[36px] font-black tracking-[-.04em] text-[#10243e] sm:text-[48px]">Explore your route <span className="text-[#0b63ce]">on the map.</span></h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#6d7c90]">View itinerary stops, hotels, restaurants, attractions and essential demo points in one place. Route metrics are estimates for planning.</p>
      </div>
      <div className="flex flex-wrap gap-2"><button onClick={()=>setMapMode("route")} className={`rounded-xl px-4 py-2.5 text-[11px] font-extrabold ${mapMode==="route"?"bg-[#0b63ce] text-white":"border border-[#dfe7ef] bg-white text-[#53657a]"}`}><Route size={14} className="mr-1 inline"/> Route</button><button onClick={()=>setMapMode("discover")} className={`rounded-xl px-4 py-2.5 text-[11px] font-extrabold ${mapMode==="discover"?"bg-[#0b63ce] text-white":"border border-[#dfe7ef] bg-white text-[#53657a]"}`}><Search size={14} className="mr-1 inline"/> Discover</button><Link href="/plan-trip" className="rounded-xl bg-[#ffd447] px-4 py-2.5 text-[11px] font-extrabold text-[#10243e]">Edit Trip</Link></div>
      </div>
      {status && <div className="mt-4 rounded-xl border border-[#dceadf] bg-[#f3fbf5] px-4 py-3 text-[11px] font-bold text-[#327049]">{status}</div>}
    </div></section>

    <section className="container-page pt-7"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="order-2 min-h-[600px] xl:order-1">
        <TripMap center={[destination.latitude,destination.longitude]} points={filtered} route={mapMode==="route"?route:[]} selectedId={selectedId} onSelect={(point)=>setSelectedId(point.id)} />
      </div>
      <aside className="order-1 space-y-4 xl:order-2">
        <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-5 shadow-[0_18px_45px_rgba(20,55,95,.06)]">
          <div className="flex items-center justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b63ce]">Trip location</div><div className="mt-1 text-[22px] font-black text-[#20364f]">{destination.name}</div><div className="text-[11px] font-bold text-[#8a97a8]">{destination.state}</div></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6ff] text-[#0b63ce]"><MapPin size={22}/></div></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Distance" value={`${routeDistance.toFixed(1)} km`} icon={<Route size={14}/>} /><Metric label="Travel time" value={prettyTime(travelMinutes)} icon={<ClockIcon />} /><Metric label="Est. cost" value={formatINR(transportCost)} icon={<WalletIcon/>} /></div>
        </div>
        <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-5 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="flex items-center justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b63ce]">Map filters</div><div className="mt-1 text-[13px] font-extrabold text-[#53657a]">Show nearby places</div></div><button onClick={resetMap} className="text-[#8a97a8] hover:text-[#0b63ce]" aria-label="Reset filters"><RefreshCw size={15}/></button></div>
          <div className="mt-4 relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a97a8]"/><input value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9" placeholder="Search places…"/></div>
          <div className="mt-4 grid grid-cols-2 gap-2">{CATEGORIES.map(item=><button key={item.id} onClick={()=>toggleCategory(item.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[10px] font-extrabold ${selectedCategories.includes(item.id)?"border-[#cfe3fb] bg-[#f2f8ff] text-[#0b63ce]":"border-[#e7edf3] bg-white text-[#8390a1]"}`}>{item.icon}{item.label}</button>)}</div>
        </div>
        <div className="rounded-[26px] border border-[#e5ebf2] bg-white p-5 shadow-[0_18px_45px_rgba(20,55,95,.06)]"><div className="flex items-center justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b63ce]">Route stops</div><div className="mt-1 text-[13px] font-extrabold text-[#53657a]">Numbered itinerary</div></div><span className="rounded-full bg-[#f2f8ff] px-2.5 py-1 text-[9px] font-extrabold text-[#0b63ce]">{route.length} stops</span></div>
          <div className="mt-4 space-y-2">{route.map(point=><button key={point.id} onClick={()=>setSelectedId(point.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedId===point.id?"border-[#b8d6f8] bg-[#f5f9ff]":"border-[#edf1f5] bg-[#fbfcfe] hover:border-[#d6e6f7]"}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0b63ce] text-[10px] font-black text-white">{point.routeOrder}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-extrabold text-[#20364f]">{point.name}</span><span className="block truncate text-[10px] font-bold text-[#8a97a8]">{point.subtitle}</span></span><ChevronRight size={14} className="text-[#a1adba]"/></button>)}</div>
        </div>
        <div className="rounded-[26px] border border-[#dcecff] bg-[#f3f8ff] p-5"><div className="flex items-center gap-2 text-[11px] font-extrabold text-[#0b63ce]"><Sparkles size={15}/> TravelSetu map insight</div><p className="mt-2 text-[11px] leading-5 text-[#53657a]">Map coordinates for hotel, restaurant, hospital and fuel points are demo placements generated around the destination because the local dataset does not include exact POI coordinates.</p></div>
      </aside>
    </div></section>
  </main>;
}

function Metric({label,value,icon}:{label:string;value:string;icon:React.ReactNode}){return <div className="rounded-xl bg-[#f8fafc] p-3"><div className="flex items-center gap-1.5 text-[#0b63ce]">{icon}<span className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#8a97a8]">{label}</span></div><div className="mt-1 text-[11px] font-extrabold text-[#20364f]">{value}</div></div>}
function ClockIcon(){return <Clock3 size={14}/>}
function WalletIcon(){return <WalletCards size={14}/> }
