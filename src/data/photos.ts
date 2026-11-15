// Site photography: real photographs of each Earth analogue site, keyed by site id.
// Every image comes from Wikimedia Commons under a free licence and is stored locally in public/photos/<id>/
// as <file>.webp (up to 1600 px) and <file>-sm.webp (640x480 thumbnail). `source` links each file to its Commons page.
// Only public domain, CC0, CC BY and CC BY-SA files are used; CC BY(-SA) credits note the resize and WebP conversion.
// Sites with no entry had no openly licensed photo that clearly shows that exact place.

export interface SitePhoto {
  file: string;
  w: number;
  h: number;
  caption: string;
  /** Khmer caption. */
  captionKm: string;
  credit: string;
  license: string;
  licenseUrl?: string;
  /** The original file page on Wikimedia Commons. */
  source: string;
}

export const SITE_PHOTOS: Record<string, SitePhoto[]> = {
  "mauna-loa": [
    {
      "file": "1",
      "w": 1600,
      "h": 458,
      "caption": "Mokuʻāweoweo, the summit caldera of Mauna Loa",
      "captionKm": "Mokuʻāweoweo ជាកាល់ដេរ៉ានៅកំពូលភ្នំភ្លើង Mauna Loa",
      "credit": "Ivtorov, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:2017-Moku%27%C4%81weoweo.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1064,
      "caption": "An erupting fissure and fresh lava flows on Mauna Loa's Northeast Rift Zone, November 2022",
      "captionKm": "ស្នាមប្រេះកំពុងផ្ទុះ និងលំហូរកម្អែភ្នំភ្លើងថ្មីៗ នៅតំបន់ប្រេះភាគឦសាននៃ Mauna Loa ខែវិច្ឆិកា ២០២២",
      "credit": "USGS Hawaiian Volcano Observatory, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Mauna_Loa_fissure_eruption_and_lava_flow_(111152).jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1064,
      "caption": "A 2022 lava flow cutting across the Mauna Loa Observatory road",
      "captionKm": "លំហូរកម្អែភ្នំភ្លើងឆ្នាំ ២០២២ កាត់ផ្តាច់ផ្លូវទៅកាន់ស្ថានីយសង្កេតការណ៍ Mauna Loa",
      "credit": "L. Gallant/USGS, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Lava_flow_cutting_the_Mauna_Loa_Observatory_Road.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1060,
      "caption": "The broad basaltic shield of Mauna Loa seen from Puʻu Huluhulu",
      "captionKm": "ភ្នំភ្លើងខែលបាសាល់ដ៏ធំទូលាយ Mauna Loa មើលពី Puʻu Huluhulu",
      "credit": "Thomas Tunsch, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Mauna_Loa_from_Pu%CA%BBu_Huluhulu_(DSC_4542).jpg"
    },
    {
      "file": "5",
      "w": 1600,
      "h": 1065,
      "caption": "Mauna Loa photographed from the International Space Station",
      "captionKm": "Mauna Loa ថតពីស្ថានីយអវកាសអន្តរជាតិ",
      "credit": "NASA/Tim Kopra, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:ISS-47_Mauna_Loa,_Hawaii.jpg"
    }
  ],
  "askja": [
    {
      "file": "1",
      "w": 1600,
      "h": 912,
      "caption": "Aerial view of the Askja caldera lake Öskjuvatn, with the Víti explosion crater in front",
      "captionKm": "ទិដ្ឋភាពពីលើអាកាសនៃបឹងកាល់ដេរ៉ា Öskjuvatn នៅ Askja ដែលមានរណ្តៅផ្ទុះ Víti នៅខាងមុខ",
      "credit": "Areuland, via Wikimedia Commons",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:%C3%96skjuvatn_und_Viti.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1067,
      "caption": "Víti, the warm geothermal crater lake at Askja",
      "captionKm": "Víti ជាបឹងរណ្តៅកម្តៅផែនដីដែលមានទឹកក្តៅឧណ្ហៗ នៅ Askja",
      "credit": "Boaworm, via Wikimedia Commons",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Viti_geothermal_lake_at_Askja.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1200,
      "caption": "Young lava fields (Kvíslahraun and Suðurbotnahraun) inside the Askja caldera",
      "captionKm": "វាលកម្អែភ្នំភ្លើងថ្មីៗ (Kvíslahraun និង Suðurbotnahraun) ក្នុងកាល់ដេរ៉ា Askja",
      "credit": "Areuland, via Wikimedia Commons",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Kvislahraun_und_Su%C3%B0urbotnahraun.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1200,
      "caption": "Sulphur fumaroles on the rim of Víti crater, Askja",
      "captionKm": "រន្ធចំហាយស្ពាន់ធ័រ នៅលើគែមរណ្តៅ Víti នៃ Askja",
      "credit": "Areuland, via Wikimedia Commons",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Schwefelfumarolen_Viti.jpg"
    }
  ],
  "lanzarote": [
    {
      "file": "1",
      "w": 1600,
      "h": 833,
      "caption": "Caldera Quemada volcanic cones, Timanfaya National Park",
      "captionKm": "កោណភ្នំភ្លើង Caldera Quemada នៅឧទ្យានជាតិ Timanfaya",
      "credit": "H. Zell, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Timanfaya_-_Lanzarote_13.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1067,
      "caption": "Hydrothermal deposits on the south side of Montaña de Timanfaya",
      "captionKm": "កករកម្តៅទឹកក្រោមដី នៅជម្រាលខាងត្បូងនៃភ្នំ Montaña de Timanfaya",
      "credit": "H. Zell, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Timanfaya_-_Lanzarote_18.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1063,
      "caption": "Inside the Corona lava tube at Cueva de los Verdes, with a still pool reflecting the tube roof",
      "captionKm": "ខាងក្នុងបំពង់កម្អែភ្នំភ្លើង Corona នៅ Cueva de los Verdes ដែលមានស្រះទឹកស្ងៀមឆ្លុះពិដានបំពង់",
      "credit": "Lviatour, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Lanzarote_5_Luc_Viatour.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 858,
      "caption": "The Corona volcano, source of the lava tube, seen from the Cueva de los Verdes",
      "captionKm": "ភ្នំភ្លើង Corona ដែលជាប្រភពនៃបំពង់កម្អែ មើលពី Cueva de los Verdes",
      "credit": "Luis Miguel Bugallo Sánchez (Lmbuga), via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Paisaje_volc%C3%A1nica_con_el_volc%C3%A1n_de_la_Corona_desde_la_Cueva_de_los_Verdes_-_Lanzarote_-_CV08.jpg"
    },
    {
      "file": "5",
      "w": 1600,
      "h": 1200,
      "caption": "Jameos del Agua, a collapsed section (skylight) of the Corona lava tube",
      "captionKm": "Jameos del Agua ជាផ្នែកដែលស្រុតបាក់ (រន្ធធ្លុះ) នៃបំពង់កម្អែភ្នំភ្លើង Corona",
      "credit": "Enric, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:04_Jameos_del_Agua,_T%C3%BAnel_de_la_Atl%C3%A1ntida.jpg"
    }
  ],
  "craters-of-the-moon": [
    {
      "file": "1",
      "w": 1600,
      "h": 1200,
      "caption": "Indian Tunnel, a lava tube with collapsed skylights, Craters of the Moon",
      "captionKm": "Indian Tunnel ជាបំពង់កម្អែភ្នំភ្លើងដែលមានរន្ធធ្លុះស្រុត នៅ Craters of the Moon",
      "credit": "chip_p, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Crmo_indian_tunnel.jpg"
    },
    {
      "file": "2",
      "w": 1000,
      "h": 811,
      "caption": "Basalt lava formation at Craters of the Moon National Monument",
      "captionKm": "ទម្រង់កម្អែបាសាល់ នៅវិមានជាតិ Craters of the Moon",
      "credit": "Daniel Mayer, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Lava_formation_at_Craters_of_the_Moon_National_Monument.jpeg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1200,
      "caption": "The edge of a basalt lava flow at Craters of the Moon",
      "captionKm": "គែមនៃលំហូរកម្អែបាសាល់ នៅ Craters of the Moon",
      "credit": "Craters of the Moon National Monument & Preserve, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:The_lava%27s_edge_(13996622134).jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1066,
      "caption": "Lichen-covered lava and sagebrush steppe at Craters of the Moon National Monument",
      "captionKm": "កម្អែភ្នំភ្លើងគ្របដោយស្លែ និងវាលស្មៅ sagebrush នៅវិមានជាតិ Craters of the Moon",
      "credit": "Bureau of Land Management, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Craters_of_the_Moon_National_Monument_(16994531546).jpg"
    }
  ],
  "atacama-yungay": [
    {
      "file": "1",
      "w": 1600,
      "h": 1200,
      "caption": "Patterned ground (soil polygons) in the hyperarid core of the Atacama Desert, about 8 km from Yungay",
      "captionKm": "ដីមានលំនាំ (ពហុកោណដី) នៅតំបន់ស្នូលស្ងួតបំផុតនៃវាលខ្សាច់ Atacama ចម្ងាយប្រហែល ៨ គ.ម. ពី Yungay",
      "credit": "Christof 123456, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Patterned_ground_located_in_the_Atacama_Desert_(Chile).jpg"
    }
  ],
  "mcmurdo-dry-valleys": [
    {
      "file": "1",
      "w": 1441,
      "h": 1600,
      "caption": "The McMurdo Dry Valleys from orbit (ASTER satellite image)",
      "captionKm": "ជ្រលងស្ងួត McMurdo មើលពីគន្លងគោចរ (រូបភាពផ្កាយរណប ASTER)",
      "credit": "NASA/GSFC/METI/ERSDAC/JAROS, and U.S./Japan ASTER Science Team, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Dry_Valleys,_Antarctica.jpg"
    },
    {
      "file": "2",
      "w": 1000,
      "h": 662,
      "caption": "Wright Valley, one of the largest of the McMurdo Dry Valleys",
      "captionKm": "ជ្រលង Wright ដែលជាជ្រលងធំបំផុតមួយក្នុងចំណោមជ្រលងស្ងួត McMurdo",
      "credit": "Michael Studinger, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Wright_Valley_2013_01.jpg"
    },
    {
      "file": "3",
      "w": 1092,
      "h": 729,
      "caption": "Aerial view up Taylor Valley from Lake Bonney",
      "captionKm": "ទិដ្ឋភាពពីលើអាកាសឡើងតាមជ្រលង Taylor ពីបឹង Bonney",
      "credit": "Warren B. Hamilton, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Taylor_Valley.png"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1200,
      "caption": "Don Juan Pond, a hypersaline lake in the upper Wright Valley that rarely freezes",
      "captionKm": "ស្រះ Don Juan ជាបឹងទឹកប្រៃខ្លាំងនៅជ្រលង Wright ខាងលើ ដែលកម្រនឹងកក",
      "credit": "Pierre Roudier, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Don_Juan_Pond,_South_Fork,_Upper_Wright_Valley,_Antarctica._(24758281740).jpg"
    },
    {
      "file": "5",
      "w": 1600,
      "h": 1067,
      "caption": "Blood Falls, iron-rich brine seeping from Taylor Glacier, Taylor Valley",
      "captionKm": "Blood Falls ទឹកប្រៃសម្បូរជាតិដែកហូរចេញពីផ្ទាំងទឹកកក Taylor នៅជ្រលង Taylor",
      "credit": "Peter Rejcek, NSF, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Blood_Falls_aerial_view_2014-11-21_03.jpg"
    }
  ],
  "haughton": [
    {
      "file": "1",
      "w": 1600,
      "h": 1000,
      "caption": "The 23 km Haughton impact crater on Devon Island, seen by Landsat 8",
      "captionKm": "រណ្តៅបុក Haughton ទំហំ ២៣ គ.ម. លើកោះ Devon ថតដោយផ្កាយរណប Landsat 8",
      "credit": "Justin Cowart, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Haughton_Crater_-_Landsat_8_(48010457521).png"
    },
    {
      "file": "2",
      "w": 1164,
      "h": 1461,
      "caption": "NASA's K10 rover \"Red\" during field tests at Haughton Crater",
      "captionKm": "រ៉ូវើរ K10 \"Red\" របស់ NASA កំពុងសាកល្បងនៅរណ្តៅ Haughton",
      "credit": "NASA, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:K10_red_rover_at_Haughton_Crater.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1200,
      "caption": "A simulated spacesuit traverse to a gypsum deposit at Gemini Hills, inside Haughton crater",
      "captionKm": "ការធ្វើដំណើរក្លែងធ្វើក្នុងឈុតអវកាស ទៅកាន់កករហ្គីបស៊ូមនៅ Gemini Hills ក្នុងរណ្តៅ Haughton",
      "credit": "Brian Shiro, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:FMARS_2009_gypsum_field.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1115,
      "caption": "Shock-metamorphosed gneiss from the Haughton impact structure",
      "captionKm": "ថ្ម gneiss ដែលប្រែប្រួលដោយការប៉ះទង្គិច ពីរចនាសម្ព័ន្ធរណ្តៅបុក Haughton",
      "credit": "James St. John, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Shocked_gneiss_(Eocene,_39_Ma;_Haughton_Impact_Structure,_Devon_Island,_northern_Canada)_1_(16841437026).jpg"
    }
  ],
  "meteor-crater": [
    {
      "file": "1",
      "w": 1600,
      "h": 517,
      "caption": "Barringer Meteor Crater, Arizona, from the rim",
      "captionKm": "រណ្តៅអាចម៍ផ្កាយ Barringer រដ្ឋ Arizona មើលពីគែមរណ្តៅ",
      "credit": "Mike Peel, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Barringer_Crater_2015_065.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1063,
      "caption": "The raised rim of Meteor Crater",
      "captionKm": "គែមរណ្តៅដែលលើកខ្ពស់នៃ Meteor Crater",
      "credit": "Graeme Churchard, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Meteor_Crater_rim_Arizona_USA.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1063,
      "caption": "Meteor Crater's raised rim above the flat plain, seen from the north-north-west",
      "captionKm": "គែមលើកខ្ពស់នៃ Meteor Crater នៅលើវាលរាបស្មើ មើលពីទិសពាយ័ព្យ",
      "credit": "Graeme Churchard, via Wikimedia Commons",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Meteor_Crater_in_Arizona_viewed_from_road.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1200,
      "caption": "Coconino Sandstone shattered by the impact, Barringer Meteor Crater",
      "captionKm": "ថ្មភក់ Coconino ដែលបែកខ្ទេចដោយការបុក នៅរណ្តៅអាចម៍ផ្កាយ Barringer",
      "credit": "Raymond M. Coveney, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Shattered_Coconino_Sandstone_at_Barringer_Meteor_Crater_-_panoramio.jpg"
    }
  ],
  "lonar": [
    {
      "file": "1",
      "w": 1600,
      "h": 1067,
      "caption": "Lonar crater lake, an impact crater in Deccan basalt",
      "captionKm": "បឹងរណ្តៅ Lonar ជារណ្តៅបុកក្នុងថ្មបាសាល់ Deccan",
      "credit": "Biswas Dibyendu, via Wikimedia Commons",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Lonar_Crater_Lake,_Maharashtra,_India-01.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 346,
      "caption": "Old temple walls on the rim of Lonar crater",
      "captionKm": "ជញ្ជាំងប្រាសាទចាស់ៗ នៅលើគែមរណ្តៅ Lonar",
      "credit": "Avinash.bhokare, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Lonar_lake_and_temple.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1067,
      "caption": "Lonar crater seen from space",
      "captionKm": "រណ្តៅ Lonar មើលពីអវកាស",
      "credit": "NASA, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Lonar_Crater_Lake_from_space.JPG"
    }
  ],
  "rio-tinto": [
    {
      "file": "1",
      "w": 1600,
      "h": 1067,
      "caption": "The red, acidic water of the Río Tinto",
      "captionKm": "ទឹកពណ៌ក្រហម និងមានជាតិអាស៊ីតនៃទន្លេ Río Tinto",
      "credit": "Estevoaei, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:R%C3%ADo_Tinto.jpg"
    },
    {
      "file": "2",
      "w": 1044,
      "h": 1600,
      "caption": "Iron-rich deposits on the Río Tinto river bed near Zalamea la Real",
      "captionKm": "កករសម្បូរជាតិដែកលើបាតទន្លេ Río Tinto ក្បែរ Zalamea la Real",
      "credit": "LBM1948, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:R%C3%ADo_Tinto,_cauce_01.jpg"
    },
    {
      "file": "3",
      "w": 1082,
      "h": 1600,
      "caption": "The source of the Río Tinto near Nerva",
      "captionKm": "ប្រភពទន្លេ Río Tinto ក្បែរ Nerva",
      "credit": "LBM1948, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:R%C3%ADo_Tinto,_nacimiento_03.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1060,
      "caption": "Corta Atalaya, the open-pit mine at Minas de Riotinto at the head of the river",
      "captionKm": "Corta Atalaya ជាអណ្តូងរ៉ែបើកចំហនៅ Minas de Riotinto ត្រង់ក្បាលទន្លេ",
      "credit": "David Perez, via Wikimedia Commons",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Minas_de_Riotinto_01_Atalaya_by-dpc.jpg"
    }
  ],
  "namib": [
    {
      "file": "1",
      "w": 1600,
      "h": 1067,
      "caption": "Aerial view of the dunes around Sossusvlei, Namib Sand Sea",
      "captionKm": "ទិដ្ឋភាពពីលើអាកាសនៃទួលខ្សាច់ជុំវិញ Sossusvlei នៃសមុទ្រខ្សាច់ Namib",
      "credit": "Cindy Heppelmann & Hp.Baumeler, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Sossusvlei_(2018).jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1067,
      "caption": "A star dune at Sossusvlei, Namib Sand Sea",
      "captionKm": "ទួលខ្សាច់រាងផ្កាយនៅ Sossusvlei នៃសមុទ្រខ្សាច់ Namib",
      "credit": "Diego Delso, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Duna_en_Sossusvlei,_Namibia,_2018-08-06,_DD_005.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1068,
      "caption": "Deadvlei, a clay pan enclosed by dunes in the Namib Sand Sea",
      "captionKm": "Deadvlei ជាវាលដីឥដ្ឋដែលព័ទ្ធជុំវិញដោយទួលខ្សាច់ ក្នុងសមុទ្រខ្សាច់ Namib",
      "credit": "Giles Laurent, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:054a_Dead_camel_thorn_trees_in_Deadvlei_Photo_by_Giles_Laurent.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1067,
      "caption": "Testing the iron content of Sossusvlei's red sand with a magnet",
      "captionKm": "ការសាកល្បងរកជាតិដែកក្នុងខ្សាច់ក្រហមនៃ Sossusvlei ដោយប្រើមេដែក",
      "credit": "Hp.Baumeler, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Iron_content_in_sand_Sossusvlei_(2018).jpg"
    }
  ],
  "svalbard-bockfjorden": [
    {
      "file": "1",
      "w": 1600,
      "h": 796,
      "caption": "Bockfjorden with the Sverrefjellet volcano and the Trolltindane peaks",
      "captionKm": "ឈូងសមុទ្រ Bockfjorden ជាមួយភ្នំភ្លើង Sverrefjellet និងកំពូលភ្នំ Trolltindane",
      "credit": "Bjoertvedt, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Haakon_VII_Land_Bockfjorden_IMG_5543_Trolltindane_Sverrefjellet_Adolfbreen_Sm%C3%B6rstabben.JPG"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 689,
      "caption": "The shores of Bockfjorden, northern Spitsbergen",
      "captionKm": "ឆ្នេរនៃ Bockfjorden ភាគខាងជើងកោះ Spitsbergen",
      "credit": "Bjoertvedt, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Haakon_VII_Land_Bockfjorden_IMG_5544_Risefjella_Kronprinsh%C3%B6gda_Bockfjorden_Adolfbreen.JPG"
    }
  ],
  "qaidam": [
    {
      "file": "1",
      "w": 1024,
      "h": 267,
      "caption": "Wind-carved yardangs in the Qaidam (Tsaidam) Basin",
      "captionKm": "យ៉ាដាងដែលខ្យល់ឆ្លាក់ នៅអាងទន្លេ Qaidam (Tsaidam)",
      "credit": "John Hill, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Yardangs_in_the_Tsaidam_Desert.jpg"
    }
  ],
  "ries": [
    {
      "file": "1",
      "w": 1600,
      "h": 900,
      "caption": "Aerial view of the southern rim of the Nördlinger Ries crater",
      "captionKm": "ទិដ្ឋភាពពីលើអាកាសនៃគែមខាងត្បូងនៃរណ្តៅ Nördlinger Ries",
      "credit": "Archaecopteryx, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Riesrand-s%C3%BCd.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1600,
      "caption": "The 24 km Nördlinger Ries crater from orbit, 1973",
      "captionKm": "រណ្តៅ Nördlinger Ries ទំហំ ២៤ គ.ម. មើលពីគន្លងគោចរ ឆ្នាំ ១៩៧៣",
      "credit": "NASA/USGS, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:N%C3%B6rdlinger_Ries_crater_1973-11-18_DZB1207-500027L007001.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 900,
      "caption": "Suevite impact breccia with glass and coesite from Otting, Nördlinger Ries",
      "captionKm": "ថ្មបែកបុក suevite ដែលមានកញ្ចក់ និង coesite ពី Otting នៃ Nördlinger Ries",
      "credit": "Raimond Spekking, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Suevite,_Glass,_Coesite._Otting,_N%C3%B6rdlinger_Ries,_Germany-8904.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1067,
      "caption": "The \"Rauhe Burg\", a block of rock thrown out by the impact, on the Ries rim near Ebermergen",
      "captionKm": "\"Rauhe Burg\" ជាដុំថ្មដែលត្រូវបោះចេញដោយការបុក នៅលើគែម Ries ក្បែរ Ebermergen",
      "credit": "Fabiologist, via Wikimedia Commons",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Blick_auf_die_Riesscholle_%22Rauhe_Burg%22.jpg"
    }
  ],
  "danakil-dallol": [
    {
      "file": "1",
      "w": 1600,
      "h": 1066,
      "caption": "Aerial view of the Dallol hydrothermal field in the Danakil Depression",
      "captionKm": "ទិដ្ឋភាពពីលើអាកាសនៃវាលកម្តៅទឹកក្រោមដី Dallol ក្នុងតំបន់ទំនាប Danakil",
      "credit": "Thomas Fuhrmann, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Ethiopia_-_Dallol.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1200,
      "caption": "Coloured salt and sulphur deposits at Dallol",
      "captionKm": "កករអំបិល និងស្ពាន់ធ័រចម្រុះពណ៌ នៅ Dallol",
      "credit": "Ji-Elle, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dallol-Ethiopie_(10).jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1200,
      "caption": "Salt mountains at Dallol",
      "captionKm": "ភ្នំអំបិល នៅ Dallol",
      "credit": "Ji-Elle, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dallol-Montagnes_de_sel_(6).jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1072,
      "caption": "Salt and sulphur deposits around a fumarole at Dallol",
      "captionKm": "កករអំបិល និងស្ពាន់ធ័រជុំវិញរន្ធចំហាយ នៅ Dallol",
      "credit": "Jan Markiewicz, via Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dallol_fumarole_solne_-_panoramio.jpg"
    }
  ],
  "mistastin": [
    {
      "file": "1",
      "w": 1600,
      "h": 1568,
      "caption": "Mistastin Lake and its impact crater, Landsat 8, September 2017",
      "captionKm": "បឹង Mistastin និងរណ្តៅបុករបស់វា ផ្កាយរណប Landsat 8 ខែកញ្ញា ២០១៧",
      "credit": "NASA Earth Observatory, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Mistastin_oli_2017254_lrg.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1333,
      "caption": "Mistastin crater from the Sentinel-2A satellite, June 2020",
      "captionKm": "រណ្តៅ Mistastin ពីផ្កាយរណប Sentinel-2A ខែមិថុនា ២០២០",
      "credit": "NASA/USGS, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Mistastin_crater_L1C_T20UMG_T20VMH_A026091_20200620T152632.jpg"
    }
  ],
  "harrat-khaybar": [
    {
      "file": "1",
      "w": 1600,
      "h": 1058,
      "caption": "Harrat Khaybar volcanic field photographed from the International Space Station",
      "captionKm": "វាលភ្នំភ្លើង Harrat Khaybar ថតពីស្ថានីយអវកាសអន្តរជាតិ",
      "credit": "Expedition 16 crew, NASA, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Harrat_Khaybar_Space.jpg"
    },
    {
      "file": "2",
      "w": 1440,
      "h": 1600,
      "caption": "Lava flows and volcanic cones of Harrat Khaybar from orbit",
      "captionKm": "លំហូរកម្អែ និងកោណភ្នំភ្លើងនៃ Harrat Khaybar មើលពីគន្លងគោចរ",
      "credit": "NASA Earth Observatory (Lauren Dauphin), Landsat data from USGS, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:%D8%AD%D8%B1%D8%A9_%D8%AE%D9%8A%D8%A8%D8%B1.jpg"
    }
  ],
  "lut-desert": [
    {
      "file": "1",
      "w": 1600,
      "h": 352,
      "caption": "Kaluts (giant yardangs) in the Dasht-e Lut",
      "captionKm": "Kalut (យ៉ាដាងយក្ស) នៅវាលខ្សាច់ Dasht-e Lut",
      "credit": "THORSTEN, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Kalout,_Dasht-e-Lut,_Iran,_21.09.2015_04.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 489,
      "caption": "Panorama of the Dasht-e Lut at sunset",
      "captionKm": "ទេសភាពទូលាយនៃវាលខ្សាច់ Dasht-e Lut ពេលថ្ងៃលិច",
      "credit": "Diego Delso, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Desierto_de_Lut,_Ir%C3%A1n,_2016-09-22,_DD_71-86_HDR_PAN.jpg"
    },
    {
      "file": "3",
      "w": 1586,
      "h": 1600,
      "caption": "Yardang ridges of the Lut Desert photographed from Space Shuttle mission STS-2",
      "captionKm": "ជួរយ៉ាដាងនៃវាលខ្សាច់ Lut ថតពីបេសកកម្មយានអវកាស STS-2",
      "credit": "NASA/STS-2 crew, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:STS-2_Lut_Desert.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1194,
      "caption": "The Dasht-e Lut from orbit (ASTER satellite image)",
      "captionKm": "វាលខ្សាច់ Dasht-e Lut មើលពីគន្លងគោចរ (រូបភាពផ្កាយរណប ASTER)",
      "credit": "NASA/METI/AIST/Japan Space Systems, and U.S./Japan ASTER Science Team, via Wikimedia Commons",
      "license": "Public domain",
      "source": "https://commons.wikimedia.org/wiki/File:Dasht-e_Lut,_Iran_(ASTER).jpg"
    }
  ],
  "wolfe-creek": [
    {
      "file": "1",
      "w": 1600,
      "h": 1200,
      "caption": "Wolfe Creek meteorite crater, Western Australia",
      "captionKm": "រណ្តៅអាចម៍ផ្កាយ Wolfe Creek នៅរដ្ឋ Western Australia",
      "credit": "MissMegido, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Wolfe_creek_meteorite_crater.jpg"
    },
    {
      "file": "2",
      "w": 1600,
      "h": 1064,
      "caption": "Inside Wolfe Creek crater",
      "captionKm": "ខាងក្នុងរណ្តៅ Wolfe Creek",
      "credit": "TerryT2, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Wolfe_Creek_crater_NP.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 905,
      "caption": "Wolfe Creek crater rim at sunset",
      "captionKm": "គែមរណ្តៅ Wolfe Creek ពេលថ្ងៃលិច",
      "credit": "JAMO B, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Wolfe_Creek_Meteorite_Crater_at_Sunset.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 998,
      "caption": "The Wolfe Creek crater area in a false-colour Copernicus Sentinel-2A image",
      "captionKm": "តំបន់រណ្តៅ Wolfe Creek ក្នុងរូបភាពពណ៌ក្លែងក្លាយពីផ្កាយរណប Copernicus Sentinel-2A",
      "credit": "European Space Agency, via Wikimedia Commons",
      "license": "CC BY-SA 3.0 igo",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/igo/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Wolfe_Creek,_Australia_ESA370618.jpg"
    }
  ],
  "death-valley": [
    {
      "file": "1",
      "w": 1600,
      "h": 583,
      "caption": "Badwater Basin salt flats, Death Valley",
      "captionKm": "វាលអំបិល Badwater Basin នៅ Death Valley",
      "credit": "Vixip, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Badwater_Basin_panorama.jpg"
    },
    {
      "file": "2",
      "w": 1067,
      "h": 1600,
      "caption": "Hexagonal salt polygons on the Badwater Basin floor",
      "captionKm": "ពហុកោណអំបិលរាងប្រាំមួយជ្រុង នៅលើបាត Badwater Basin",
      "credit": "Aleksomber, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Badwater_salt_formations.jpg"
    },
    {
      "file": "3",
      "w": 1600,
      "h": 1067,
      "caption": "A shallow brine pool on the salt crust at Badwater Basin",
      "captionKm": "ស្រះទឹកប្រៃរាក់ៗ លើស្រទាប់អំបិលនៅ Badwater Basin",
      "credit": "Christian David, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Salt_pool_at_Badwater_Basin,_Death_Valley_National_Park,_California.jpg"
    },
    {
      "file": "4",
      "w": 1600,
      "h": 1064,
      "caption": "Devils Golf Course, jagged rock salt in Death Valley",
      "captionKm": "Devils Golf Course ជាអំបិលថ្មស្រួចៗ នៅ Death Valley",
      "credit": "Supercarwaar, via Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Devils_Golf_Course.jpg"
    }
  ]
};
