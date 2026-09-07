import type { Destination, TripForm } from "@/types/travel";

export type ItineraryActivity = {
  id: string;
  time: string;
  name: string;
  type: "stay" | "activity" | "food" | "transport" | "free-time";
  location: string;
  description: string;
  estimatedCost: number;
  durationMinutes: number;
  image?: string;
  safety: "SAFE" | "CAUTION" | "AT RISK";
};

export type ItineraryDay = {
  day: number;
  date: string;
  title: string;
  summary: string;
  estimatedCost: number;
  activities: ItineraryActivity[];
};

export type Itinerary = {
  destination: string;
  from: string;
  startDate: string;
  endDate: string;
  duration: number;
  travellers: number;
  estimatedCost: number;
  currency: "INR";
  tripSummary: string;
  packingSuggestions: string[];
  travelTips: string[];
  days: ItineraryDay[];
};

export function itinerarySchema() {
  const activity = {
    type: "object",
    properties: {
      id: { type: "string" },
      time: { type: "string" },
      name: { type: "string" },
      type: { type: "string", enum: ["stay", "activity", "food", "transport", "free-time"] },
      location: { type: "string" },
      description: { type: "string" },
      estimatedCost: { type: "integer", minimum: 0 },
      durationMinutes: { type: "integer", minimum: 15 },
      image: { type: "string" },
      safety: { type: "string", enum: ["SAFE", "CAUTION", "AT RISK"] },
    },
    required: ["id", "time", "name", "type", "location", "description", "estimatedCost", "durationMinutes", "safety"],
  };
  return {
    type: "object",
    properties: {
      destination: { type: "string" },
      from: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      duration: { type: "integer", minimum: 1 },
      travellers: { type: "integer", minimum: 1 },
      estimatedCost: { type: "integer", minimum: 0 },
      currency: { type: "string", enum: ["INR"] },
      tripSummary: { type: "string" },
      packingSuggestions: { type: "array", items: { type: "string" } },
      travelTips: { type: "array", items: { type: "string" } },
      days: { type: "array", minItems: 1, items: {
        type: "object",
        properties: {
          day: { type: "integer", minimum: 1 },
          date: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          estimatedCost: { type: "integer", minimum: 0 },
          activities: { type: "array", minItems: 1, items: activity },
        },
        required: ["day", "date", "title", "summary", "estimatedCost", "activities"],
      } },
    },
    required: ["destination", "from", "startDate", "endDate", "duration", "travellers", "estimatedCost", "currency", "tripSummary", "packingSuggestions", "travelTips", "days"],
  };
}

function safeInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export function validateItinerary(input: unknown, trip: TripForm): Itinerary {
  if (!input || typeof input !== "object") throw new Error("Invalid itinerary response");
  const candidate = input as Record<string, unknown>;
  const rawDays = Array.isArray(candidate.days) ? candidate.days : [];
  if (!candidate.destination || !rawDays.length) throw new Error("Incomplete itinerary response");

  const days: ItineraryDay[] = rawDays.slice(0, 14).map((rawDay, index) => {
    const d = (rawDay && typeof rawDay === "object" ? rawDay : {}) as Record<string, unknown>;
    const rawActivities = Array.isArray(d.activities) ? d.activities : [];
    const activities: ItineraryActivity[] = rawActivities.slice(0, 10).map((rawActivity, activityIndex) => {
      const a = (rawActivity && typeof rawActivity === "object" ? rawActivity : {}) as Record<string, unknown>;
      const activityType = ["stay", "activity", "food", "transport", "free-time"].includes(String(a.type)) ? String(a.type) as ItineraryActivity["type"] : "activity";
      const safety = ["SAFE", "CAUTION", "AT RISK"].includes(String(a.safety)) ? String(a.safety) as ItineraryActivity["safety"] : "SAFE";
      return {
        id: String(a.id || `day-${index + 1}-${activityIndex + 1}`),
        time: String(a.time || "Flexible"),
        name: String(a.name || "Planned stop"),
        type: activityType,
        location: String(a.location || trip.destination),
        description: String(a.description || "A personalized TravelSetu stop."),
        estimatedCost: safeInt(a.estimatedCost),
        durationMinutes: Math.max(15, safeInt(a.durationMinutes, 60)),
        image: typeof a.image === "string" ? a.image : undefined,
        safety,
      };
    });
    return {
      day: index + 1,
      date: String(d.date || trip.startDate),
      title: String(d.title || `Day ${index + 1}`),
      summary: String(d.summary || "A balanced day planned around your preferences."),
      estimatedCost: safeInt(d.estimatedCost, activities.reduce((sum, item) => sum + item.estimatedCost, 0)),
      activities: activities.length ? activities : [{
        id: `day-${index + 1}-1`, time: "10:00 AM", name: "Local exploration", type: "activity", location: trip.destination,
        description: "Explore a local highlight at your own pace.", estimatedCost: 500, durationMinutes: 90, safety: "SAFE"
      }],
    };
  });

  const duration = Math.max(1, safeInt(candidate.duration, days.length));
  const estimatedCost = safeInt(candidate.estimatedCost, days.reduce((sum, day) => sum + day.estimatedCost, 0));
  return {
    destination: String(candidate.destination || trip.destination),
    from: String(candidate.from || trip.from),
    startDate: String(candidate.startDate || trip.startDate),
    endDate: String(candidate.endDate || trip.endDate),
    duration,
    travellers: Math.max(1, safeInt(candidate.travellers, trip.travellers)),
    estimatedCost,
    currency: "INR",
    tripSummary: String(candidate.tripSummary || `A personalized ${trip.destination} journey for ${trip.travellers} traveller${trip.travellers === 1 ? "" : "s"}.`),
    packingSuggestions: Array.isArray(candidate.packingSuggestions) ? candidate.packingSuggestions.slice(0, 12).map(String) : ["Comfortable walking shoes", "Reusable water bottle", "Light layers"],
    travelTips: Array.isArray(candidate.travelTips) ? candidate.travelTips.slice(0, 10).map(String) : ["Keep your itinerary flexible and check local conditions before outdoor activities."],
    days,
  };
}

export function buildDemoItinerary(trip: TripForm, destination?: Destination): Itinerary {
  const duration = Math.max(1, Math.min(7, Math.floor((new Date(`${trip.endDate}T00:00:00`).getTime() - new Date(`${trip.startDate}T00:00:00`).getTime()) / 86400000)) || 1);
  const image = destination?.image;
  const dayTemplates = [
    ["Arrival & Local Explore", [["09:00 AM", "Hotel check-in", "stay", 1800], ["01:00 PM", "Mall Road & Old Manali walk", "activity", 250], ["07:30 PM", "Himachali dinner", "food", 900]]],
    ["Mountain Views & Adventure", [["08:00 AM", "Solang Valley", "activity", 1200], ["01:30 PM", "Riverside lunch", "food", 700], ["04:30 PM", "Old Manali café stop", "free-time", 450]]],
    ["Culture & Slow Travel", [["09:30 AM", "Hidimba Temple", "activity", 150], ["12:00 PM", "Manali market", "activity", 500], ["07:00 PM", "Local cuisine tasting", "food", 850]]],
    ["Nature Day", [["07:30 AM", "Vashisht hot springs", "activity", 150], ["11:00 AM", "Scenic village drive", "activity", 800], ["06:30 PM", "Sunset viewpoint", "activity", 300]]],
    ["Leisure & Departure", [["09:00 AM", "Breakfast and packing", "stay", 500], ["11:30 AM", "Souvenir shopping", "activity", 700], ["03:00 PM", "Departure transfer", "transport", 1200]]],
  ] as const;
  const days = Array.from({ length: duration }, (_, index) => {
    const template = dayTemplates[index % dayTemplates.length];
    const date = new Date(`${trip.startDate}T00:00:00`); date.setDate(date.getDate() + index);
    const activities: ItineraryActivity[] = template[1].map(([time, name, type, cost], activityIndex) => ({
      id: `demo-${index + 1}-${activityIndex + 1}`,
      time, name, type: type as ItineraryActivity["type"], location: trip.destination,
      description: `Suggested ${name.toLowerCase()} selected for a ${trip.travelStyle.toLowerCase()} trip.`, estimatedCost: cost,
      durationMinutes: 90, image, safety: name === "Solang Valley" ? "CAUTION" : "SAFE"
    }));
    return { day: index + 1, date: date.toISOString().slice(0,10), title: template[0], summary: `A ${trip.travelStyle.toLowerCase()} day balancing ${trip.interests.slice(0, 2).join(" and ") || "local highlights"}.`, estimatedCost: activities.reduce((s, a) => s + a.estimatedCost, 0), activities };
  });
  const total = days.reduce((sum, day) => sum + day.estimatedCost, 0);
  return { destination: trip.destination, from: trip.from, startDate: trip.startDate, endDate: trip.endDate, duration, travellers: trip.travellers, estimatedCost: Math.min(trip.budget || total, total || trip.budget), currency: "INR", tripSummary: `A demo-ready personalized itinerary for ${trip.destination}, built around your budget, interests and travel style.`, packingSuggestions: ["Comfortable walking shoes", "Light layers", "Reusable water bottle", "Power bank", "Personal medicines"], travelTips: ["Keep one flexible time block each day.", "Check local weather before outdoor activities.", "Carry a reusable bottle and travel light."], days };
}
