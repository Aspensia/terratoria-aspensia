import { R } from "./references";

// Provenance for every data product Terratoria uses. Shown on the Data and Methods page
// and in each site's provenance panel. Archived products — none of this is live or real-time.
export interface Dataset {
  id: string;
  group: "nasa" | "partner" | "other";
  agency: string;
  mission: string;
  instrument: string;
  product: string;
  version: string;
  resolution: string;
  period: string;
  level: "raw" | "processed" | "derived" | "literature";
  url: string;
  usedFor: string;
  quality: string;
  /** APA 7 data citation. Organisation authors are used where the archive names no individual. */
  apa: string;
}

const RETRIEVED = "Retrieved November 14, 2026, from";

export const DATASETS: Dataset[] = [
  {
    id: "lola",
    group: "nasa",
    agency: "NASA",
    mission: "Lunar Reconnaissance Orbiter",
    instrument: "Lunar Orbiter Laser Altimeter (LOLA)",
    product: "LRO-L-LOLA-4-GDR-V1.0: LDEM_80S_80M (south pole), LDEM_64 (global)",
    version: "v3.1 (LDEM_64, created 2019-03-15)",
    resolution: "80 m (polar stereographic); 64 px/deg, about 474 m (cylindrical)",
    period: "2009 onward, cumulative",
    level: "processed",
    url: "https://pds-geosciences.wustl.edu/missions/lro/lola.htm",
    usedFor: "Moon terrain: slope, relief, roughness, hypsometry and elevation profile",
    quality: "Gridded product; interpolated between laser tracks. Resampled to 463 m by block-averaging.",
    apa: "LRO LOLA Science Team. (2019). Lunar Reconnaissance Orbiter Lunar Orbiter Laser Altimeter gridded data records (LRO-L-LOLA-4-GDR-V1.0; LDEM_64 v3.1, LDEM_80S_80M) [Data set]. NASA Planetary Data System Geosciences Node. https://pds-geosciences.wustl.edu/missions/lro/lola.htm",
  },
  {
    id: "diviner",
    group: "nasa",
    agency: "NASA",
    mission: "Lunar Reconnaissance Orbiter",
    instrument: "Diviner Lunar Radiometer Experiment",
    product: "LRO-L-DLRE-5-GCP-V1.0 Global Cumulative Product (bolometric brightness temperature)",
    version: "1 (created 2016-05-27)",
    resolution: "0.5° x 0.5° x 0.25 h local time",
    period: "2009-07-05 to 2015-04-01",
    level: "processed",
    url: "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
    usedFor: "Moon thermal: mean, maximum and minimum surface temperature over the lunar day",
    quality: "Bins with no nadir observations (-9999) are excluded; at least 48 of 96 local-time bins are required. A 0.5° bin at the pole mixes sunlit rim and shadowed floor.",
    apa: "Williams, J.-P. (2016). LRO Diviner Lunar Radiometer Experiment global cumulative products (LRO-L-DLRE-5-GCP-V1.0) [Data set]. NASA Planetary Data System Geosciences Node. https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
  },
  {
    id: "mola",
    group: "nasa",
    agency: "NASA",
    mission: "Mars Global Surveyor",
    instrument: "Mars Orbiter Laser Altimeter (MOLA)",
    product: "MGS-M-MOLA-5-MEGDR-L3-V1.0 topography (megt), 128 px/deg",
    version: "2.0 (created 2003-03-21)",
    resolution: "128 px/deg, about 463 m at the equator",
    period: "1997 to 2001",
    level: "processed",
    url: "https://pds-geosciences.wustl.edu/missions/mgs/megdr.html",
    usedFor: "Mars terrain: slope, relief, roughness, hypsometry and elevation profile",
    quality: "Gridded product with interpolation between tracks, widest near the equator. Sets the 463 m common baseline for all worlds.",
    apa: "MGS MOLA Science Team. (2003). Mars Global Surveyor Mars Orbiter Laser Altimeter mission experiment gridded data records (MGS-M-MOLA-5-MEGDR-L3-V1.0) [Data set]. NASA Planetary Data System Geosciences Node. https://pds-geosciences.wustl.edu/missions/mgs/megdr.html",
  },
  {
    id: "power",
    group: "nasa",
    agency: "NASA",
    mission: "Prediction Of Worldwide Energy Resources (POWER)",
    instrument: "MERRA-2 reanalysis (model assimilating satellite observations)",
    product: "POWER Climatology API: TS, TS_MAX, TS_MIN, WS10M",
    version: "POWER v2 API, annual climatology",
    resolution: "0.5° x 0.625°",
    period: "Multi-decade climatology (as returned by the API)",
    level: "derived",
    url: "https://power.larc.nasa.gov/",
    usedFor: "Earth thermal and wind: skin temperature mean and extremes, 10 m wind speed",
    quality: "Reanalysis, not a direct observation. One grid cell (about 50 km) per site, so local microclimates such as crater floors or valley bottoms are not resolved.",
    apa: `NASA Langley Research Center. (n.d.). Prediction Of Worldwide Energy Resources (POWER) climatology API [Data set]. ${RETRIEVED} https://power.larc.nasa.gov/`,
  },
  {
    id: "copdem",
    group: "partner",
    agency: "ESA / European Commission (Copernicus)",
    mission: "TanDEM-X (DLR / Airbus)",
    instrument: "X-band synthetic aperture radar interferometry",
    product: "Copernicus DEM GLO-90 (DSM), cloud-optimised GeoTIFF",
    version: "DGED 2021 release (public AWS bucket)",
    resolution: "3 arc-seconds, about 90 m",
    period: "2010 to 2015 acquisitions",
    level: "processed",
    url: "https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM",
    usedFor: "Earth terrain: slope, relief, roughness, hypsometry and elevation profile",
    quality: "Surface model: includes vegetation and buildings. Water is stored as 0 m and is excluded. Chosen over NASADEM because it needs no login and covers the polar sites.",
    apa: "European Space Agency. (2022). Copernicus DEM [Data set]. https://doi.org/10.5270/ESA-c5d3d65",
  },
  {
    id: "meda",
    group: "other",
    agency: "NASA / CAB (Spain)",
    mission: "Mars 2020 Perseverance",
    instrument: "Mars Environmental Dynamics Analyzer (MEDA)",
    product: "Published summary: Rodriguez-Manfredi et al. (2023), Nature Geoscience 16",
    version: "First 250 sols",
    resolution: "Single in-situ station",
    period: "2021",
    level: "literature",
    url: "https://doi.org/10.1038/s41561-022-01084-0",
    usedFor: "Mars thermal at Jezero: near-surface air temperature mean and daily swing",
    quality: "Literature value, not processed by us. Air temperature at 1.45 m, compared against surface skin temperature on Earth. No thermal data were used for Arsia Mons.",
    apa: R.rodriguezmanfredi2023,
  },
  {
    id: "literature",
    group: "other",
    agency: "Peer-reviewed literature",
    mission: "n/a",
    instrument: "n/a",
    product: "Characteristic tags for geology, illumination, water and ice, aeolian features, biology, subsurface and operations",
    version: "Compiled November 2026",
    resolution: "Site level",
    period: "Publications from 1973 to 2023",
    level: "literature",
    url: "https://www.usgs.gov/data/known-terrestrial-analog-sites-planetary-science",
    usedFor: "Six literature-derived dimensions and site status",
    quality: "Every journal reference was checked against its Crossref record (author, year, title, volume, pages, DOI) in November 2026; four reports and books were checked against NASA and publisher records. Formatted in APA 7th edition.",
    apa: "See the full reference list on this page.",
  },
  {
    id: "gibs",
    group: "nasa",
    agency: "NASA",
    mission: "Earth Observing System Data and Information System",
    instrument: "Global Imagery Browse Services (GIBS)",
    product: "BlueMarble_ShadedRelief_Bathymetry",
    version: "Static composite",
    resolution: "500 m native; 4096 × 2048 px used for the 3D globe",
    period: "Composite, not time-specific",
    level: "processed",
    url: "https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api",
    usedFor: "Earth map basemap and the 3D Earth texture (display only, not scored)",
    quality: "Imagery for context. Not used in any similarity score.",
    apa: `NASA Global Imagery Browse Services. (n.d.). Blue Marble shaded relief and bathymetry [Image layer]. ${RETRIEVED} https://gibs.earthdata.nasa.gov/`,
  },
  {
    id: "nasa3d",
    group: "nasa",
    agency: "NASA",
    mission: "NASA 3D Resources",
    instrument: "Planetary texture maps and Apollo photographs",
    product: "Mars, Venus, Jupiter, Saturn and Neptune maps; Hipparcos star map; two Apollo images",
    version: "GitHub repository, master branch",
    resolution: "720 to 2880 px wide",
    period: "Various",
    level: "processed",
    url: "https://github.com/nasa/NASA-3D-Resources",
    usedFor: "3D scenes and the image viewer (display only, not scored)",
    quality: "Imagery for context. Not used in any similarity score.",
    apa: `National Aeronautics and Space Administration. (n.d.). NASA 3D resources [Image collection]. GitHub. ${RETRIEVED} https://github.com/nasa/NASA-3D-Resources`,
  },
];
