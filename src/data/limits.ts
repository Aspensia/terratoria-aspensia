import type { Body } from "../lib/types";

/** Conditions no Earth site reproduces. Shown on every comparison. */
export const LIMITS: Record<Exclude<Body, "earth">, string[]> = {
  moon: [
    "Vacuum: there is no air, so no wind, weather or convective cooling.",
    "Gravity is one sixth of Earth's, which changes how soil, vehicles and people behave.",
    "Unshielded solar and cosmic radiation, and micrometeorite impacts.",
    "A day lasts 29.5 Earth days; at the poles the Sun stays near the horizon.",
    "Lunar soil is sharp, glassy and electrostatically charged; no Earth material matches it fully.",
    "Permanently shadowed craters reach about 40 K, far colder than anywhere on Earth.",
  ],
  mars: [
    "Surface pressure is under 1% of Earth's, in a carbon dioxide atmosphere.",
    "Gravity is 38% of Earth's.",
    "Strong ultraviolet and particle radiation reach the surface.",
    "Soils contain perchlorate salts and almost no organic matter.",
    "No rain, rivers or plants have reshaped the surface for billions of years.",
    "Temperatures swing by 50 to 60 K every day and are far below freezing on average.",
  ],
};

export const GENERAL_LIMITS = [
  "Instruments differ between worlds: laser altimeters on the Moon and Mars, radar on Earth, with different native resolutions.",
  "All terrain is compared at a 463 m baseline. Boulders, small craters and other features below that scale are not captured.",
  "Each place is one 60 km window. A different window at the same site could score differently.",
  "Earth climate values come from a 50 km reanalysis grid cell, not a ground station.",
  "Literature-derived dimensions depend on what has been published, so well-studied sites can score higher.",
  "How similar a site is and how practical it is to work there are separate questions.",
];
