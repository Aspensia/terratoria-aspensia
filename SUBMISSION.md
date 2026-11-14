# Space Apps project page: draft text

Draft for the team to edit. Every field must be in English. Replace anything in [brackets].

## Project Name

PROJECT: Terratoria (made by Aspensia)

## Team

Aspensia: six high school students from Cambodia. Mak Chansereirath (lead software developer and data analyst), Keo Amarak (software developer and data analyst), Sareth Puthyreach (data analyst and video producer), Sun Panharath (storytelling lead and video producer), Yim Pichpanhasak (software tuning and quality assurance), Lim Rothsothyr (research and data lead). All six aim to become engineers recognised around the world, and PROJECT: Terratoria is part of how they are preparing for the global stage.

## High-Level Project Summary

PROJECT: Terratoria is a website that uses NASA and partner-agency datasets to study the environments of the Moon and Mars and to find places on Earth with similar features, so that experiments there can help plan bases on those worlds.

Visitors can explore interactive 3D globes, terrain models and side-by-side comparisons that show how the landscapes of Earth relate to the Moon and Mars, and how lessons learned at home could help build a self-sustaining lunar base. Places such as the Atacama Desert, the Haughton impact crater and Death Valley share features with the Moon or Mars, which makes them natural test sites. NASA has worked this way before: Apollo astronauts rehearsed lunar field geology at sites on Earth that resembled the Moon (Phinney, 2015).

Under the hood, Terratoria compares 21 Earth sites against four reference regions (Shackleton crater and the Marius Hills on the Moon; Jezero crater and Arsia Mons on Mars). Terrain, temperature and wind are measured from open NASA and ESA data that we processed ourselves; geology, ice, biology and other properties come from peer-reviewed research, every reference checked and cited in APA style. A Mission Plan page turns the results into a five-step plan for a lunar base, with real field campaigns as examples, and states clearly what Earth analogues cannot reproduce.

## Link to Project Demo

[link to the 7-slide deck or 30-second video; must open without login]

## Link to Final Project

[public site URL] and [public repository URL]

## Detailed Project Description

**What it does.** Terratoria compares 21 Earth sites against 4 reference regions: Shackleton crater and the Marius Hills pit on the Moon, and Jezero crater and the north flank of Arsia Mons on Mars. For each pair it scores eight dimensions taken from the challenge statement: terrain; geology and materials; temperature and light; water and ice; dust and wind; biology and habitability; caves and subsurface; and exploration operations. The user sets a weight for each dimension, or picks a preset such as "Lunar Base Research" or "Mars Rover Mobility", and the ranking updates at once.

**How it works.** A data pipeline reads a 60 km window around each place from open archives: LOLA for the Moon, MOLA for Mars and Copernicus DEM for Earth. Every source is resampled to the same 463 m grid so that a slope means the same thing on each world. From each window we compute the slope distribution, local relief, roughness and hypsometry. Lunar temperatures come from the LRO Diviner cumulative product, and Earth temperatures and wind from NASA POWER. The other dimensions use a fixed vocabulary of characteristics, each backed by a citation; the score is the share of the reference region's characteristics that are also documented at the Earth site.

The overall "Exploratory Analogue Similarity Index" is a weighted mean: Σ(weight × data quality × score) ÷ Σ(weight × data quality). A dimension with no data is left out and reported as unknown; it reduces the coverage figure but never the score. No index is shown with fewer than three valid dimensions.

**What we found.** With equal weights, the McMurdo Dry Valleys rank first for Shackleton crater (index 65), matching on ground ice and cold, dry, wind-scoured terrain while remaining about 170 K warmer. Lava-tube sites (Lanzarote, Craters of the Moon, Mauna Loa) lead for the Marius Hills pit (73 to 76). The Atacama Desert and the Qaidam Basin lead for Jezero crater (71 and 68). For Arsia Mons, Mauna Loa leads (76), and one of our own untested candidates, the Harrat Khaybar lava field in Saudi Arabia with its 1.5 km Umm Jirsan lava tube, comes second (68), which makes it worth a closer look.

**Benefits.** Each site page shows the measurements side by side, shaded-relief views at identical scale, the specific differences, suggested uses tied to the dimensions that actually match, and every data source. Results export as CSV and as a printable report. The interface is available in English and Khmer, in simple and scientific modes.

**Honest limits.** Only these 24 places were analysed; this is not a global search. Earth cannot reproduce lunar vacuum, reduced gravity or the radiation environment. Mars thermal data is limited to a published summary for Jezero. Three of the Earth sites are our own candidates and have not been validated in the field. The index is a screening aid, not a probability.

**What we hope to achieve.** A reusable, transparent way to shortlist analogue sites, extendable to more regions, more sites, spectral data and an automated global scan.

**Tools.** TypeScript, Next.js (static export), Tailwind CSS, Three.js, MapLibre GL JS, Recharts, Web Audio API, Node.js data pipeline with geotiff.js, Vitest. [Add hosting platform.]

## Use of Artificial Intelligence

Yes. We used an AI coding assistant (Claude, by Anthropic) to write the application code, the data pipeline, the catalogue text and the Khmer interface strings, working from our own concept and direction. [Describe how the team came up with the idea and what the team reviewed, tested or changed.] The AI use is acknowledged in the repository README, on the app's About page and in the page metadata. No AI-generated images, video or audio are used. No measured value was generated by AI: all terrain and climate numbers come from the pipeline's reading of the archives. Every literature reference was checked against its Crossref or NASA record (authors, year, title, volume, pages, DOI) and is formatted in APA 7th edition; this check corrected one wrong year, one wrong title and three claims that had no verifiable source.

## NASA Data

- **Lunar Reconnaissance Orbiter, LOLA** gridded elevation (LDEM_80S_80M south polar; LDEM_64 global), from the PDS Geosciences Node. Used for lunar slope, relief, roughness and elevation profiles. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- **Lunar Reconnaissance Orbiter, Diviner** Global Cumulative Product (LRO-L-DLRE-5-GCP-V1.0), bolometric brightness temperature by local time. Used for lunar mean, minimum and maximum surface temperature. https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- **Mars Global Surveyor, MOLA** MEGDR topography at 128 pixels per degree, from the PDS Geosciences Node. Used for Martian terrain and to set the common 463 m baseline. https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
- **NASA POWER** climatology API (MERRA-2 reanalysis): Earth skin temperature mean, maximum, minimum and 10 m wind speed. Used for Earth thermal and wind comparisons. https://power.larc.nasa.gov/
- **NASA GIBS** Blue Marble imagery, as the basemap of the Earth map and the texture of the 3D Earth.
- **NASA 3D Resources** planet maps, Hipparcos star map and two Apollo photographs, for the 3D scenes and image viewer. https://github.com/nasa/NASA-3D-Resources https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api
- **Mars 2020 MEDA** results as published (Rodriguez-Manfredi et al. 2023, Nature Geoscience) for Jezero air temperature.

## Space Agency Partner Data and Other References

- **ESA / Copernicus:** Copernicus DEM GLO-90, used for all Earth terrain metrics. © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA. https://dataspace.copernicus.eu/
- **Scientific literature:** the papers cited for each site and reference region; the full list appears on every site page and in `src/data/catalog.ts`.
- **USGS** Known Terrestrial Analog Sites for Planetary Science, as background for site selection. https://www.usgs.gov/data/known-terrestrial-analog-sites-planetary-science
- **Open-source software:** Next.js, React, Tailwind CSS, MapLibre GL JS, Recharts, geotiff.js, Vitest; fonts Geist and Noto Sans Khmer.
- **AI tool:** Claude (Anthropic), as described above.

## Before you submit

- [ ] Deploy the site and open the link in a private browser window.
- [ ] Have a Khmer speaker read the Khmer interface.
- [ ] Confirm the numbers above still match the live site.
- [ ] Optional: request a FortiGuard web filter classification for the site URL.
- [ ] Slides: no more than 7, in English, with team name, member names and the challenge name.
