export type WeatherSource = "forecast" | "historical-forecast" | "demo";
export type RiskLevel = "SAFE" | "CAUTION" | "AT RISK";

export type WeatherPoint = {
  time: string;
  temperature: number;
  rainProbability: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  description: string;
};

export type DailyWeather = {
  date: string;
  minTemperature: number;
  maxTemperature: number;
  rainProbability: number;
  precipitation: number;
  maxWindSpeed: number;
  maxWindGusts: number;
  humidity: number;
  weatherCode: number;
  description: string;
  risk: RiskLevel;
  reason?: string;
};

export type WeatherResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  source: WeatherSource;
  location: string;
  current: WeatherPoint;
  daily: DailyWeather[];
  fetchedAt: string;
  fallback: boolean;
  message?: string;
};

export const WEATHER_THRESHOLDS = {
  rainProbabilityCaution: 40,
  rainProbabilityRisk: 60,
  windCautionKmh: 35,
  windRiskKmh: 55,
  coldCelsius: 2,
  hotCelsius: 38,
};

export function classifyWeatherRisk(input: {
  rainProbability: number;
  windSpeed: number;
  temperature: number;
}): { risk: RiskLevel; reason?: string } {
  if (input.rainProbability >= WEATHER_THRESHOLDS.rainProbabilityRisk) {
    return { risk: "AT RISK", reason: `Rain probability is ${Math.round(input.rainProbability)}%.` };
  }
  if (input.windSpeed >= WEATHER_THRESHOLDS.windRiskKmh) {
    return { risk: "AT RISK", reason: `Wind speed may reach ${Math.round(input.windSpeed)} km/h.` };
  }
  if (input.temperature < WEATHER_THRESHOLDS.coldCelsius || input.temperature > WEATHER_THRESHOLDS.hotCelsius) {
    return { risk: "AT RISK", reason: `Temperature is ${Math.round(input.temperature)}°C, outside the configured comfort range.` };
  }
  if (input.rainProbability >= WEATHER_THRESHOLDS.rainProbabilityCaution) {
    return { risk: "CAUTION", reason: `There is a ${Math.round(input.rainProbability)}% chance of rain.` };
  }
  if (input.windSpeed >= WEATHER_THRESHOLDS.windCautionKmh) {
    return { risk: "CAUTION", reason: `Wind speed may reach ${Math.round(input.windSpeed)} km/h.` };
  }
  return { risk: "SAFE" };
}

export function weatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    56: "Freezing drizzle", 57: "Heavy freezing drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Heavy freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Light showers", 81: "Showers", 82: "Heavy showers", 85: "Light snow showers",
    86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
  };
  return map[code] || "Changing conditions";
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

export function buildDailyWeather(raw: {
  daily?: Record<string, unknown[]>;
  hourly?: Record<string, unknown[]>;
}, dates: string[]): DailyWeather[] {
  const daily = raw.daily || {};
  const hourly = raw.hourly || {};
  const times = Array.isArray(hourly.time) ? hourly.time.map(String) : [];
  const temperature = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m.map(Number) : [];
  const rain = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability.map(Number) : [];
  const precipitation = Array.isArray(hourly.precipitation) ? hourly.precipitation.map(Number) : [];
  const wind = Array.isArray(hourly.wind_speed_10m) ? hourly.wind_speed_10m.map(Number) : [];
  const gusts = Array.isArray(hourly.wind_gusts_10m) ? hourly.wind_gusts_10m.map(Number) : [];
  const humidity = Array.isArray(hourly.relative_humidity_2m) ? hourly.relative_humidity_2m.map(Number) : [];
  const code = Array.isArray(hourly.weather_code) ? hourly.weather_code.map(Number) : [];

  return dates.map((date) => {
    const idx = times.map(dateOnly).reduce<number[]>((acc, item, i) => item === date ? [...acc, i] : acc, []);
    const values = <T,>(arr: T[]) => idx.map((i) => arr[i]).filter((v) => v !== undefined) as T[];
    const temps = values(temperature);
    const rains = values(rain);
    const precip = values(precipitation);
    const winds = values(wind);
    const gs = values(gusts);
    const hum = values(humidity);
    const codes = values(code);
    const meanHumidity = hum.length ? hum.reduce((a, b) => a + b, 0) / hum.length : 0;
    const dailyRain = Number(Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max[dates.indexOf(date)] : rains.length ? Math.max(...rains) : 0) || 0;
    const dailyPrecip = Number(Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum[dates.indexOf(date)] : precip.reduce((a, b) => a + b, 0)) || 0;
    const maxWind = Number(Array.isArray(daily.wind_speed_10m_max) ? daily.wind_speed_10m_max[dates.indexOf(date)] : winds.length ? Math.max(...winds) : 0) || 0;
    const maxGust = Number(Array.isArray(daily.wind_gusts_10m_max) ? daily.wind_gusts_10m_max[dates.indexOf(date)] : gs.length ? Math.max(...gs) : 0) || 0;
    const minT = Number(Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[dates.indexOf(date)] : temps.length ? Math.min(...temps) : 0) || 0;
    const maxT = Number(Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[dates.indexOf(date)] : temps.length ? Math.max(...temps) : 0) || 0;
    const chosenCode = Number(Array.isArray(daily.weather_code) ? daily.weather_code[dates.indexOf(date)] : codes[0]) || 0;
    const risk = classifyWeatherRisk({ rainProbability: dailyRain, windSpeed: maxWind, temperature: (minT + maxT) / 2 });
    return { date, minTemperature: minT, maxTemperature: maxT, rainProbability: dailyRain, precipitation: dailyPrecip, maxWindSpeed: maxWind, maxWindGusts: maxGust, humidity: Math.round(meanHumidity), weatherCode: chosenCode, description: weatherDescription(chosenCode), risk: risk.risk, reason: risk.reason };
  });
}

export function buildDemoWeather(latitude = 32.2396, longitude = 77.1887, dates: string[], location = "Manali"): WeatherResponse {
  const daily = dates.map((date, i) => {
    const rainProbability = i === 2 ? 78 : i === 3 ? 45 : 18;
    const maxWindSpeed = i === 2 ? 46 : 18 + i * 3;
    const risk = classifyWeatherRisk({ rainProbability, windSpeed: maxWindSpeed, temperature: 14 + i });
    return { date, minTemperature: 5 + i, maxTemperature: 19 + i, rainProbability, precipitation: i === 2 ? 12.4 : 0.8, maxWindSpeed, maxWindGusts: maxWindSpeed + 8, humidity: 66 + i, weatherCode: i === 2 ? 63 : 2, description: i === 2 ? "Rain" : "Partly cloudy", risk: risk.risk, reason: risk.reason };
  });
  const day = daily[0] || { date: new Date().toISOString().slice(0,10), minTemperature: 8, maxTemperature: 20, rainProbability: 18, precipitation: 0, maxWindSpeed: 18, maxWindGusts: 24, humidity: 64, weatherCode: 2, description: "Partly cloudy", risk: "SAFE" as RiskLevel };
  return { latitude, longitude, timezone: "Asia/Kolkata", source: "demo", location, current: { time: `${day.date}T10:00`, temperature: day.maxTemperature, rainProbability: day.rainProbability, precipitation: day.precipitation, windSpeed: day.maxWindSpeed, humidity: day.humidity, weatherCode: day.weatherCode, description: day.description }, daily, fetchedAt: new Date().toISOString(), fallback: true, message: "Showing demo weather because live weather is unavailable or the dates are outside the supported live forecast window." };
}
