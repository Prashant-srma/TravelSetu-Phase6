import { NextResponse } from "next/server";
import destinations from "@/data/destinations.json";
import { buildDailyWeather, buildDemoWeather, type WeatherResponse } from "@/lib/weather";

export const runtime = "nodejs";

function cleanDate(value: unknown, fallback: string) {
  const s = String(value || fallback);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback;
}

function parseDates(body: Record<string, unknown>) {
  if (Array.isArray(body.dates)) return body.dates.map((d) => cleanDate(d, "")).filter(Boolean).slice(0, 14);
  const start = cleanDate(body.startDate, new Date().toISOString().slice(0, 10));
  const end = cleanDate(body.endDate, start);
  const result: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const final = new Date(`${end}T00:00:00Z`);
  while (cursor <= final && result.length < 14) { result.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  return result.length ? result : [start];
}

async function fetchOpenMeteo(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    return await response.json() as Record<string, any>;
  } finally { clearTimeout(timeout); }
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json() as Record<string, unknown>;
    const destinationName = String(body.destination || "Manali");
    const destination = destinations.find((item) => item.name.toLowerCase() === destinationName.toLowerCase());
    const latitude = Number(body.latitude ?? destination?.latitude ?? 32.2396);
    const longitude = Number(body.longitude ?? destination?.longitude ?? 77.1887);
    const dates = parseDates(body);
    const location = destination?.name || destinationName;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Valid destination coordinates are required.");

    const start = dates[0];
    const end = dates[dates.length - 1];
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T23:59:59Z`);
    const forecastUpper = new Date(today); forecastUpper.setUTCDate(forecastUpper.getUTCDate() + 16);

    let raw: Record<string, any>;
    let source: WeatherResponse["source"];
    if (startDate >= today && endDate <= forecastUpper) {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(latitude));
      url.searchParams.set("longitude", String(longitude));
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("temperature_unit", "celsius");
      url.searchParams.set("wind_speed_unit", "kmh");
      url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m");
      url.searchParams.set("daily", "weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max");
      url.searchParams.set("forecast_days", "16");
      raw = await fetchOpenMeteo(url.toString());
      source = "forecast";
    } else if (startDate < today && endDate < today) {
      const url = new URL("https://historical-forecast-api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(latitude));
      url.searchParams.set("longitude", String(longitude));
      url.searchParams.set("start_date", start);
      url.searchParams.set("end_date", end);
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("temperature_unit", "celsius");
      url.searchParams.set("wind_speed_unit", "kmh");
      url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m");
      url.searchParams.set("daily", "weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max");
      raw = await fetchOpenMeteo(url.toString());
      source = "historical-forecast";
    } else {
      throw new Error("The requested travel dates cross outside Open-Meteo's live forecast window.");
    }

    const daily = buildDailyWeather(raw, dates);
    if (!daily.length) throw new Error("Weather service returned no forecast for these dates.");
    const hourly = (raw.hourly || {}) as Record<string, any[]>;
    const times = Array.isArray(hourly.time) ? hourly.time.map(String) : [];
    const firstIndex = Math.max(0, times.findIndex((t) => t.startsWith(start)));
    const first = daily[0];
    const current = {
      time: times[firstIndex] || `${start}T10:00`,
      temperature: Number(hourly.temperature_2m?.[firstIndex] ?? first.maxTemperature),
      rainProbability: Number(hourly.precipitation_probability?.[firstIndex] ?? first.rainProbability),
      precipitation: Number(hourly.precipitation?.[firstIndex] ?? first.precipitation),
      windSpeed: Number(hourly.wind_speed_10m?.[firstIndex] ?? first.maxWindSpeed),
      humidity: Number(hourly.relative_humidity_2m?.[firstIndex] ?? first.humidity),
      weatherCode: Number(hourly.weather_code?.[firstIndex] ?? first.weatherCode),
      description: first.description,
    };
    return NextResponse.json({ latitude, longitude, timezone: String(raw.timezone || "auto"), source, location, current, daily, fetchedAt: new Date().toISOString(), fallback: false } satisfies WeatherResponse);
  } catch (error) {
    console.error("/api/weather error", error);
    try {
      const destinationName = String(body.destination || "Manali");
      const destination = destinations.find((item) => item.name.toLowerCase() === destinationName.toLowerCase());
      const fallback = buildDemoWeather(destination?.latitude, destination?.longitude, parseDates(body), destination?.name || destinationName);
      return NextResponse.json({ ...fallback, message: `Weather service is temporarily unavailable. ${fallback.message}` });
    } catch {
      return NextResponse.json({ error: "Weather service is temporarily unavailable." }, { status: 503 });
    }
  }
}
