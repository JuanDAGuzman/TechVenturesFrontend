// utils/shipping.ts
import { normCity } from "./text";

export function getCarrierOptions(city?: string) {
  const c = normCity(city);
  if (c === "bogota") return ["PICAP", "INTERRAPIDISIMO"];
  return ["INTERRAPIDISIMO"];
}
