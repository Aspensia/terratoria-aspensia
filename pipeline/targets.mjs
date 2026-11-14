// Every place the pipeline analyses. This list IS the geographic coverage of AnalogAtlas:
// 4 reference regions and the Earth sites below, one 60 km window each. Nothing else was searched.
// lon is east-positive; Moon/Mars use 0-360 E planetocentric.
export const TARGETS = [
  // Reference regions
  { id: "moon-shackleton", body: "moon", lat: -89.67, lon: 129.78 },
  { id: "moon-marius", body: "moon", lat: 14.09, lon: 303.23 },
  { id: "mars-jezero", body: "mars", lat: 18.41, lon: 77.69 },
  { id: "mars-arsia", body: "mars", lat: -6.0, lon: 239.6 },
  // Earth sites
  { id: "mauna-loa", body: "earth", lat: 19.602, lon: -155.487 },
  { id: "askja", body: "earth", lat: 65.03, lon: -16.75 },
  { id: "lanzarote", body: "earth", lat: 29.03, lon: -13.63 },
  { id: "craters-of-the-moon", body: "earth", lat: 43.42, lon: -113.52 },
  { id: "atacama-yungay", body: "earth", lat: -24.08, lon: -69.92 },
  { id: "mcmurdo-dry-valleys", body: "earth", lat: -77.86, lon: 160.71 },
  { id: "haughton", body: "earth", lat: 75.38, lon: -89.67 },
  { id: "meteor-crater", body: "earth", lat: 35.027, lon: -111.022 },
  { id: "lonar", body: "earth", lat: 19.977, lon: 76.508 },
  { id: "rio-tinto", body: "earth", lat: 37.72, lon: -6.55 },
  { id: "namib", body: "earth", lat: -24.75, lon: 15.3 },
  { id: "svalbard-bockfjorden", body: "earth", lat: 79.43, lon: 13.3 },
  { id: "pilbara", body: "earth", lat: -21.15, lon: 119.43 },
  { id: "qaidam", body: "earth", lat: 38.4, lon: 91.5 },
  { id: "ries", body: "earth", lat: 48.88, lon: 10.57 },
  { id: "danakil-dallol", body: "earth", lat: 14.24, lon: 40.3 },
  { id: "mistastin", body: "earth", lat: 55.88, lon: -63.3 },
  { id: "harrat-khaybar", body: "earth", lat: 25.72, lon: 39.95 },
  { id: "lut-desert", body: "earth", lat: 30.6, lon: 58.9 },
  { id: "wolfe-creek", body: "earth", lat: -19.17, lon: 127.8 },
];
