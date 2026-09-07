import { NextResponse } from "next/server";
import destinations from "@/data/destinations.json";
import hotels from "@/data/hotels.json";
import restaurants from "@/data/restaurants.json";
import activities from "@/data/activities.json";
import type { TripForm } from "@/types/travel";
import { buildDemoItinerary, itinerarySchema, validateItinerary } from "@/lib/itinerary";
import { friendlyGeminiFallbackMessage, generateStructuredContent } from "@/lib/gemini";
import type { Destination } from "@/types/travel";

export const runtime = "nodejs";

function parseTrip(input: unknown): TripForm {
  if (!input || typeof input !== "object") throw new Error("Trip details are required");
  const trip = input as Partial<TripForm>;
  const interests = Array.isArray(trip.interests) ? trip.interests.filter(Boolean).slice(0, 8) : [];
  const result: TripForm = {
    from: String(trip.from || "Delhi").slice(0, 80),
    destination: String(trip.destination || "Manali").slice(0, 80),
    startDate: String(trip.startDate || "2025-10-15"),
    endDate: String(trip.endDate || "2025-10-20"),
    travellers: Math.min(20, Math.max(1, Number(trip.travellers) || 1)),
    budget: Math.max(0, Number(trip.budget) || 0),
    interests: interests as TripForm["interests"],
    foodPreference: (trip.foodPreference || "Any") as TripForm["foodPreference"],
    transport: (trip.transport || "Any") as TripForm["transport"],
    travelStyle: (trip.travelStyle || "Balanced") as TripForm["travelStyle"],
    accommodationPreference: String(trip.accommodationPreference || "Comfortable stay").slice(0, 80),
    specialRequirements: String(trip.specialRequirements || "").slice(0, 500),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(result.endDate)) throw new Error("Please provide valid travel dates");
  if (!result.destination.trim()) throw new Error("Destination is required");
  return result;
}

export async function POST(request: Request) {
  let trip: TripForm | null = null;
  try {
    const body = await request.json();
    trip = parseTrip(body?.trip);
    const destination = destinations.find((item) => item.name.toLowerCase() === trip.destination.toLowerCase()) as Destination | undefined;
    const fallback = buildDemoItinerary(trip, destination);
    const demoMode = process.env.DEMO_MODE === "true" || !process.env.GEMINI_API_KEY;

    if (demoMode) {
      return NextResponse.json({ itinerary: fallback, source: "demo", message: process.env.GEMINI_API_KEY ? "Demo mode is enabled." : "Gemini API key is missing. Showing demo itinerary." });
    }

    const destinationContext = destination ? JSON.stringify({ name: destination.name, state: destination.state, categories: destination.category, bestTime: destination.bestTime, safetyTips: destination.safetyTips }) : "Destination not in local catalog.";
    const localCatalog = JSON.stringify({
      hotels: hotels.filter((item: { destinationId: string }) => destination ? item.destinationId === destination.id : true).slice(0, 8),
      restaurants: restaurants.filter((item: { destinationId: string }) => destination ? item.destinationId === destination.id : true).slice(0, 10),
      activities: activities.filter((item: { destinationId: string }) => destination ? item.destinationId === destination.id : true).slice(0, 16),
    });
    const prompt = `You are TravelSetu's itinerary planner. Build a realistic Indian travel itinerary strictly within the user's budget where possible. Use local catalog items when useful; never invent prices that are wildly inconsistent with the catalog. Balance the trip according to the user's interests and travel style. Avoid unsafe outdoor recommendations without a caution label. Return only JSON matching the supplied schema.\n\nUSER TRIP:\n${JSON.stringify(trip)}\n\nDESTINATION CONTEXT:\n${destinationContext}\n\nLOCAL CATALOG:\n${localCatalog}`;

    const { response, model } = await generateStructuredContent({
      contents: prompt,
      responseSchema: itinerarySchema(),
    });

    let parsed: unknown;
    try { parsed = JSON.parse(response.text || "{}"); } catch { throw new Error("Gemini returned invalid JSON"); }
    const itinerary = validateItinerary(parsed, trip);
    return NextResponse.json({ itinerary, source: "gemini", model });
  } catch (error) {
    console.error("/api/gemini error", error);
    if (trip) {
      const destination = destinations.find((item) => item.name.toLowerCase() === trip!.destination.toLowerCase()) as Destination | undefined;
      return NextResponse.json({ itinerary: buildDemoItinerary(trip, destination), source: "fallback", message: friendlyGeminiFallbackMessage() });
    }
    return NextResponse.json({ error: "Unable to generate an itinerary right now. Please check your trip details and try again." }, { status: 400 });
  }
}
