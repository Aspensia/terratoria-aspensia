import type { Weights } from "../lib/types";

export interface Preset {
  id: string;
  name: string;
  explain: string;
  weights: Weights;
}

const w = (terrain: number, geology: number, thermal: number, water_ice: number, dust_wind: number, biology: number, subsurface: number, operations: number): Weights => ({
  terrain, geology, thermal, water_ice, dust_wind, biology, subsurface, operations,
});

export const BALANCED: Weights = w(50, 50, 50, 50, 50, 50, 50, 50);

export const PRESETS: Preset[] = [
  {
    id: "lunar-base",
    name: "Lunar Base Research",
    explain: "Raises temperature and light, water and ice, terrain and operations. Lowers biology and wind, which matter little on the Moon.",
    weights: w(80, 50, 100, 90, 20, 0, 50, 90),
  },
  {
    id: "rover-mobility",
    name: "Mars Rover Mobility",
    explain: "Raises terrain, operations and dust and wind. Geology counts for its surface materials; biology and ice are lowered.",
    weights: w(100, 60, 30, 20, 80, 0, 10, 90),
  },
  {
    id: "geology",
    name: "Geological Field Research",
    explain: "Puts geology first, then terrain and water history. Everything else is kept low.",
    weights: w(60, 100, 10, 60, 30, 20, 30, 40),
  },
  {
    id: "thermal",
    name: "Thermal Environment Research",
    explain: "Puts temperature and light first, with ice as a supporting factor. Other dimensions are nearly switched off.",
    weights: w(20, 10, 100, 60, 20, 0, 20, 20),
  },
  {
    id: "aeolian",
    name: "Dust and Aeolian Research",
    explain: "Puts dust and wind first, with terrain and surface materials as supporting factors.",
    weights: w(50, 40, 30, 10, 100, 0, 0, 30),
  },
  {
    id: "habitability",
    name: "Habitability and Subsurface Research",
    explain: "Raises biology, subsurface and water and ice. Terrain and operations are lowered.",
    weights: w(20, 50, 40, 90, 10, 100, 100, 20),
  },
];
