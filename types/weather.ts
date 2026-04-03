export type SkyPhase = "sunrise" | "day" | "sunset" | "night";

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "drizzle"
  | "thunderstorm";

export type WeatherData = {
  condition: WeatherCondition;
  conditionId: number;
  sunrise: number; // Unix timestamp
  sunset: number;
  temp: number;
};
