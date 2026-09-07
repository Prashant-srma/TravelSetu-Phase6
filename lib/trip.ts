import { TripForm } from "@/types/travel";

export const DEMO_TRIP: TripForm = {
  from: "Delhi",
  destination: "Manali",
  startDate: "2025-10-15",
  endDate: "2025-10-20",
  travellers: 3,
  budget: 20000,
  interests: ["Nature", "Adventure", "Food"],
  foodPreference: "Any",
  transport: "Any",
  travelStyle: "Balanced",
  accommodationPreference: "Comfortable stay",
  specialRequirements: "",
};

export const TRIP_STORAGE_KEY = "travelsetu_trip_draft";
export const SAVED_TRIP_STORAGE_KEY = "travelsetu_saved_trips";

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function getTripDuration(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  return diff >= 0 ? Math.floor(diff / 86400000) : 0;
}
