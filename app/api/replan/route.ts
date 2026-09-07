import { NextResponse } from "next/server";
import destinations from "@/data/destinations.json";
import restaurants from "@/data/restaurants.json";
import activities from "@/data/activities.json";
import { buildDemoItinerary, itinerarySchema, validateItinerary } from "@/lib/itinerary";
import { classifyWeatherRisk } from "@/lib/weather";
import { generateStructuredContent } from "@/lib/gemini";
import type { TripForm } from "@/types/travel";

export const runtime = "nodejs";

type AnyRecord = Record<string, any>;

const replanSchema = {
  type: "object",
  properties: { reason: { type: "string" }, replacement: itinerarySchema() },
  required: ["reason", "replacement"],
};

function validateTrip(value: unknown): TripForm {
  if (!value || typeof value !== "object") throw new Error("Trip context is required");
  const trip = value as Partial<TripForm>;
  return {
    from: String(trip.from || "Delhi"), destination: String(trip.destination || "Manali"), startDate: String(trip.startDate || "2025-10-15"), endDate: String(trip.endDate || "2025-10-20"),
    travellers: Math.max(1, Number(trip.travellers) || 1), budget: Math.max(0, Number(trip.budget) || 0),
    interests: Array.isArray(trip.interests) ? trip.interests as TripForm["interests"] : [], foodPreference: (trip.foodPreference || "Any") as TripForm["foodPreference"],
    transport: (trip.transport || "Any") as TripForm["transport"], travelStyle: (trip.travelStyle || "Balanced") as TripForm["travelStyle"],
    accommodationPreference: String(trip.accommodationPreference || "Comfortable stay"), specialRequirements: String(trip.specialRequirements || ""),
  };
}

function localFallback(trip: TripForm, dayNumber: number, reason: string) {
  const destination = destinations.find((item) => item.name.toLowerCase() === trip.destination.toLowerCase());
  const fallback = buildDemoItinerary(trip, destination);
  const index = Math.max(0, Math.min(fallback.days.length - 1, dayNumber - 1));
  const day = fallback.days[index];
  if (!day) return fallback;
  day.title = "Weather-Smart Indoor & Culture Day";
  day.activities = [
    { id: `replan-${dayNumber}-1`, time: "09:30 AM", name: "Himachal State Museum", type: "activity", location: "Himachal Pradesh", description: "Indoor cultural experience recommended while outdoor conditions are unsafe.", estimatedCost: 100, durationMinutes: 90, safety: "SAFE" },
    { id: `replan-${dayNumber}-2`, time: "12:00 PM", name: "Local café & Himachali lunch", type: "food", location: trip.destination, description: "Warm local lunch with time to relax and wait out heavy rain.", estimatedCost: 650, durationMinutes: 75, safety: "SAFE" },
    { id: `replan-${dayNumber}-3`, time: "03:30 PM", name: "Mall Road & local shopping", type: "activity", location: "Mall Road", description: "A flexible afternoon option with plenty of indoor alternatives nearby.", estimatedCost: 350, durationMinutes: 90, safety: "CAUTION" },
    { id: `replan-${dayNumber}-4`, time: "06:30 PM", name: "Vashisht cultural experience", type: "activity", location: "Vashisht", description: "A slower cultural stop to end the day without high-exposure adventure activities.", estimatedCost: 200, durationMinutes: 75, safety: "SAFE" },
  ];
  day.summary = `${reason} TravelSetu swapped the exposed outdoor activity for safer lower-exposure options.`;
  day.estimatedCost = day.activities.reduce((sum, item) => sum + item.estimatedCost, 0);
  fallback.estimatedCost = fallback.days.reduce((sum, item) => sum + item.estimatedCost, 0);
  return fallback;
}

export async function POST(request: Request) {
  let body: AnyRecord = {};
  try {
    body = await request.json() as AnyRecord;
    const trip = validateTrip(body.trip);
    const dayNumber = Math.max(1, Number(body.day || 1));
    const weatherDay = (body.weatherDay && typeof body.weatherDay === "object" ? body.weatherDay : {}) as AnyRecord;
    const affectedActivity = (body.affectedActivity && typeof body.affectedActivity === "object" ? body.affectedActivity : {}) as AnyRecord;
    const risk = classifyWeatherRisk({ rainProbability: Number(weatherDay.rainProbability || 0), windSpeed: Number(weatherDay.maxWindSpeed || weatherDay.windSpeed || 0), temperature: Number(weatherDay.temperature ?? ((Number(weatherDay.minTemperature || 0) + Number(weatherDay.maxTemperature || 0)) / 2 || 18)) });
    const reason = risk.reason || "Outdoor conditions have become less suitable.";
    const demoFallback = localFallback(trip, dayNumber, reason);
    const demoMode = process.env.DEMO_MODE === "true" || !process.env.GEMINI_API_KEY;
    if (demoMode) return NextResponse.json({ reason, replacement: demoFallback, source: "demo" });

    const destination = destinations.find((item) => item.name.toLowerCase() === trip.destination.toLowerCase());
    const localActivities = activities.filter((item: { destinationId: string }) => destination ? item.destinationId === destination.id : true).slice(0, 20);
    const localRestaurants = restaurants.filter((item: { destinationId: string }) => destination ? item.destinationId === destination.id : true).slice(0, 8);
    const prompt = `You are TravelSetu's dynamic replanning engine. One itinerary activity is weather-sensitive. Return a FULL replacement itinerary, keeping unaffected days conceptually consistent but replacing the affected day with safer lower-exposure options. Prefer indoor/cultural/food/shopping/cafés/museums. Do not suggest unsafe outdoor adventure. Respect budget, food and transport preferences. Use the local catalog where possible. Return only JSON matching the supplied schema.\n\nTRIP: ${JSON.stringify(trip)}\nAFFECTED DAY: ${dayNumber}\nAFFECTED ACTIVITY: ${JSON.stringify(affectedActivity)}\nWEATHER: ${JSON.stringify(weatherDay)}\nLOCAL ACTIVITIES: ${JSON.stringify(localActivities)}\nLOCAL RESTAURANTS: ${JSON.stringify(localRestaurants)}`;
    const { response } = await generateStructuredContent({ contents: prompt, responseSchema: replanSchema });
    const parsed = JSON.parse(response.text || "{}");
    const replacement = validateItinerary(parsed.replacement, trip);
    return NextResponse.json({ reason: String(parsed.reason || reason), replacement, source: "gemini" });
  } catch (error) {
    console.error("/api/replan error", error);
    try {
      const trip = validateTrip(body.trip);
      return NextResponse.json({ reason: "AI replanning failed, so TravelSetu used a safe local fallback plan.", replacement: localFallback(trip, Math.max(1, Number(body.day || 1)), "Live weather conditions require a safer plan."), source: "fallback" });
    } catch {
      return NextResponse.json({ error: "We could not replan this activity right now." }, { status: 400 });
    }
  }
}
