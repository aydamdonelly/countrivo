/**
 * The 15 curated lists (blueprint 7.13). Titles, descriptions, canonicals, intro prose
 * and FAQ wording are carried verbatim from the 15 hand-written page files deleted in
 * section 12; `{n}` in an intro paragraph is the entry count, exactly as the old
 * continent pages interpolated `countries.length`. Every number on a page comes from the
 * data at build, so nothing here can drift out of step with the ranking below it.
 *
 * This module is the single source for the hub, the 15 pages, lists/sitemap.ts
 * (LIST_SLUGS) and scripts/build-data-timestamps.ts (LIST_SOURCES).
 */

/** A fact tile: the value is derived from the data, the label is copy. */
export type ListFact =
  /** The country at `rank` in this list's ranking: value = its stat, label = `{name}, {label}`. */
  | { kind: "row"; rank: number; label: string }
  /** How many countries the ranking holds. */
  | { kind: "count"; label: string }
  /** The continent's leader on `stat`: value = its stat, label = `{name}, {label}`. */
  | { kind: "top"; stat: string; label: string }
  /** The continent's smallest on `stat`, same shape as `top`. */
  | { kind: "bottom"; stat: string; label: string }
  /** The continent's total on `stat`. */
  | { kind: "sum"; stat: string; label: string };

export type ListSource =
  | { kind: "stat"; category: string }
  | { kind: "continent"; continent: string; sovereign: number };

export interface ListContent {
  slug: string;
  /** <title>, verbatim; the layout template appends " | Countrivo". */
  metaTitle: string;
  description: string;
  /** Breadcrumb position 3. */
  shortName: string;
  /** The page h1. */
  h1: string;
  /** Row title and meta on /lists. */
  hubTitle: string;
  hubDescription: string;
  /** ItemList JSON-LD. */
  listName: string;
  listDescription: string;
  /** The caption under the headline number: `{leader}, {numberCaption}` for stat lists. */
  numberCaption: string;
  intro: readonly string[];
  quickFacts: readonly ListFact[];
  faq: readonly { q: string; a: string }[];
  source: ListSource;
  seeAlso: readonly string[];
}

export const LISTS: readonly ListContent[] = [
  {
    slug: "largest-countries",
    metaTitle: "Largest Countries in the World by Area (2024)",
    description:
      "Ranked list of the 50 largest countries in the world by total area in km². From Russia to Bangladesh, see how big each nation really is.",
    shortName: "Largest Countries",
    h1: "Largest Countries in the World by Area",
    hubTitle: "Largest Countries by Area",
    hubDescription:
      "The 50 biggest countries in the world ranked by total land and water area in square kilometers.",
    listName: "Largest Countries in the World by Area",
    listDescription: "The 50 largest countries in the world ranked by total area in square kilometers.",
    numberCaption: "the largest country on Earth",
    intro: [
      "The world's largest countries span entire continents. Russia alone covers over 17 million square kilometers, roughly 1.8 times the size of the second-largest country, Canada. Together, the top ten countries by area account for more than half of all the land on Earth.",
      "This ranking uses total area, which includes both land and inland water bodies such as lakes and rivers. Data is sourced from the World Bank and national geographic agencies.",
      "A country's size has profound effects on its climate diversity, natural resources, and logistical challenges. Brazil, for example, contains the world's largest tropical rainforest, while Australia's vast interior is predominantly arid desert.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which is the largest country in the world?",
        a: "Russia is the largest country in the world by area, covering approximately 17.1 million km², over 11% of Earth's total land surface.",
      },
      {
        q: "What are the top 5 largest countries by area?",
        a: "The 5 largest countries are: 1. Russia (17.1M km²), 2. Canada (10.0M km²), 3. United States (9.8M km²), 4. China (9.6M km²), 5. Brazil (8.5M km²).",
      },
    ],
    source: { kind: "stat", category: "area-km2" },
    seeAlso: ["most-populated-countries", "richest-countries", "countries-in-asia", "countries-in-africa"],
  },
  {
    slug: "most-populated-countries",
    metaTitle: "Most Populated Countries in the World (2024)",
    description:
      "Ranked list of the 50 most populated countries in the world. See current population figures for India, China, the US, and more.",
    shortName: "Most Populated Countries",
    h1: "Most Populated Countries in the World",
    hubTitle: "Most Populated Countries",
    hubDescription: "The 50 most populated countries in the world ranked by total population.",
    listName: "Most Populated Countries in the World",
    listDescription: "The 50 most populated countries ranked by total population.",
    numberCaption: "the most people of any country",
    intro: [
      "India overtook China as the world's most populated country in 2023, and both nations now have populations exceeding 1.4 billion people. The United States remains a distant third at roughly 340 million, followed by Indonesia and Pakistan.",
      "Population shapes every aspect of a nation's economy, politics, and infrastructure. Rapid growth in sub-Saharan Africa means several countries on this list, Nigeria, Ethiopia, the Democratic Republic of the Congo, are projected to climb even higher in the coming decades.",
      "The figures below reflect the most recent estimates available from the World Bank and United Nations Population Division. Total population includes all residents regardless of citizenship or legal status.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the largest population?",
        a: "India is now the most populous country in the world with approximately 1.43 billion people, surpassing China in 2023.",
      },
      {
        q: "What are the top 5 most populated countries?",
        a: "The 5 most populated countries are: 1. India (~1.43B), 2. China (~1.41B), 3. United States (~335M), 4. Indonesia (~278M), 5. Pakistan (~235M).",
      },
    ],
    source: { kind: "stat", category: "population" },
    seeAlso: ["largest-countries", "richest-countries", "countries-in-asia", "countries-in-europe"],
  },
  {
    slug: "richest-countries",
    metaTitle: "Richest Countries by GDP per Capita (2024)",
    description:
      "Ranked list of the 50 richest countries by GDP per capita in USD. Discover which nations have the highest economic output per person.",
    shortName: "Richest Countries",
    h1: "Richest Countries in the World by GDP per Capita",
    hubTitle: "Richest Countries by GDP per Capita",
    hubDescription: "The 50 wealthiest countries ranked by GDP per capita in current US dollars.",
    listName: "Richest Countries in the World by GDP per Capita",
    listDescription: "The 50 richest countries ranked by GDP per capita in current US dollars.",
    numberCaption: "the highest output per person",
    intro: [
      "GDP per capita divides a country's total economic output by its population, giving a rough measure of average prosperity. Small nations with specialized economies, such as Luxembourg, Singapore, and Ireland, consistently rank near the top because their economic output is concentrated among a relatively small population.",
      "This ranking uses nominal GDP per capita in current US dollars, which makes it easy to compare across countries but does not adjust for local purchasing power. Countries with high costs of living may appear wealthier than they feel to residents.",
      "Oil-rich Gulf states like Qatar and the United Arab Emirates also rank highly, illustrating how natural resource wealth can inflate per-capita figures. Meanwhile, large advanced economies like the United States and Germany rank lower than some microstates despite having far greater total GDP.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which is the richest country in the world?",
        a: "By GDP, the United States is the world's largest economy. By GDP per capita, Luxembourg and Singapore consistently rank among the highest.",
      },
      {
        q: "What are the top 5 richest countries by GDP?",
        a: "By total GDP: 1. United States, 2. China, 3. Germany, 4. Japan, 5. India. By GDP per capita, smaller nations like Luxembourg, Switzerland, and Norway rank highest.",
      },
    ],
    source: { kind: "stat", category: "gdp-per-capita" },
    seeAlso: ["largest-countries", "most-populated-countries", "countries-in-europe", "countries-in-americas"],
  },
  {
    slug: "countries-in-europe",
    metaTitle: "Countries in Europe | Complete List with Stats",
    description:
      "Complete list of every country in Europe with flag, capital, population, and area. From tiny Vatican City to vast Russia's European territory.",
    shortName: "Countries in Europe",
    h1: "All Countries in Europe",
    hubTitle: "Countries in Europe",
    hubDescription: "Complete list of all European countries with capitals, population, and area.",
    listName: "All Countries in Europe",
    listDescription: "Every country in Europe, listed by population, with capital and area.",
    numberCaption: "countries and territories in Europe",
    intro: [
      "Europe is home to {n} countries and territories, ranging from the vast expanse of Russia's European portion to microstates like Vatican City and Monaco. Despite being the second-smallest continent by area, Europe has played an outsized role in world history, economics, and culture.",
      "The European Union unites 27 of these nations under shared economic and political frameworks, while others, like Norway, Switzerland, and the United Kingdom, maintain close ties but operate independently. Combined, European countries produce roughly a quarter of global GDP.",
      "Below is the full list of European countries sorted by population, along with each nation's capital city, total population, and geographic area.",
    ],
    quickFacts: [
      { kind: "sum", stat: "population", label: "everyone in Europe" },
      { kind: "top", stat: "population", label: "the most populous" },
      { kind: "top", stat: "area-km2", label: "the largest" },
      { kind: "bottom", stat: "area-km2", label: "the smallest" },
    ],
    faq: [
      {
        q: "How many countries are there in Europe?",
        a: "There are 44 countries in Europe, ranging from Russia (the largest by area) to Vatican City (the smallest independent state in the world).",
      },
      {
        q: "What is the most populated country in Europe?",
        a: "Russia is the most populated country in Europe with approximately 145 million people, followed by Germany with about 84 million.",
      },
    ],
    source: { kind: "continent", continent: "Europe", sovereign: 44 },
    seeAlso: [
      "countries-in-asia",
      "countries-in-africa",
      "countries-in-americas",
      "most-populated-countries",
      "richest-countries",
    ],
  },
  {
    slug: "countries-in-asia",
    metaTitle: "Countries in Asia | Complete List with Stats",
    description:
      "Complete list of every country in Asia with flag, capital, population, and area. From China and India to Singapore and Maldives.",
    shortName: "Countries in Asia",
    h1: "All Countries in Asia",
    hubTitle: "Countries in Asia",
    hubDescription: "Complete list of all Asian countries with capitals, population, and area.",
    listName: "All Countries in Asia",
    listDescription: "Every country in Asia, listed by population, with capital and area.",
    numberCaption: "countries and territories in Asia",
    intro: [
      "Asia is the world's largest and most populous continent, home to {n} countries and territories. It stretches from Turkey and the Middle East in the west to Japan and Indonesia in the east, encompassing an extraordinary diversity of cultures, languages, and landscapes.",
      "The continent contains the two most populated countries on Earth, India and China, as well as some of the wealthiest nations per capita, including Singapore, Qatar, and the United Arab Emirates. Asia also includes vast, sparsely populated regions like Mongolia and Kazakhstan.",
      "Below is the complete list of Asian countries sorted by population, with each nation's capital, population, and total area included for reference.",
    ],
    quickFacts: [
      { kind: "sum", stat: "population", label: "everyone in Asia" },
      { kind: "top", stat: "population", label: "the most populous" },
      { kind: "top", stat: "area-km2", label: "the largest" },
      { kind: "bottom", stat: "area-km2", label: "the smallest" },
    ],
    faq: [
      {
        q: "How many countries are in Asia?",
        a: "There are 48 countries in Asia, making it the continent with the most countries. Asia is also the world's largest and most populous continent.",
      },
      {
        q: "Which is the largest country in Asia?",
        a: "Russia is the largest country in Asia by area, though China and India are the most populous Asian nations.",
      },
    ],
    source: { kind: "continent", continent: "Asia", sovereign: 48 },
    seeAlso: [
      "countries-in-europe",
      "countries-in-africa",
      "countries-in-americas",
      "largest-countries",
      "most-populated-countries",
    ],
  },
  {
    slug: "countries-in-africa",
    metaTitle: "Countries in Africa | Complete List with Stats",
    description:
      "Complete list of every country in Africa with flag, capital, population, and area. 54 nations from Nigeria to Seychelles.",
    shortName: "Countries in Africa",
    h1: "All Countries in Africa",
    hubTitle: "Countries in Africa",
    hubDescription: "Complete list of all African countries with capitals, population, and area.",
    listName: "All Countries in Africa",
    listDescription: "Every country in Africa, listed by population, with capital and area.",
    numberCaption: "countries and territories in Africa",
    intro: [
      "Africa is the second-largest continent in both area and population, comprising {n} countries and territories. It spans from the Mediterranean coastline of Morocco and Egypt in the north to the southern tip of South Africa, covering over 30 million square kilometers.",
      "Nigeria is Africa's most populous nation with over 220 million people, and the continent's population is the youngest and fastest-growing in the world. By 2050, Africa is expected to be home to roughly a quarter of the global population.",
      "The continent holds tremendous geographic diversity: the Sahara Desert in the north, the Congo rainforest in Central Africa, the Great Rift Valley in East Africa, and the savannas and wildlife reserves that draw visitors from around the globe. Below is the complete list of African countries sorted by population.",
    ],
    quickFacts: [
      { kind: "sum", stat: "population", label: "everyone in Africa" },
      { kind: "top", stat: "population", label: "the most populous" },
      { kind: "top", stat: "area-km2", label: "the largest" },
      { kind: "bottom", stat: "area-km2", label: "the smallest" },
    ],
    faq: [
      {
        q: "How many countries are in Africa?",
        a: "Africa has 54 recognized sovereign countries, making it the continent with the most countries in the world.",
      },
      {
        q: "What is the largest country in Africa?",
        a: "Algeria is the largest country in Africa by area, covering approximately 2.38 million km². It surpassed Sudan after South Sudan's independence in 2011.",
      },
    ],
    source: { kind: "continent", continent: "Africa", sovereign: 54 },
    seeAlso: [
      "countries-in-europe",
      "countries-in-asia",
      "countries-in-americas",
      "largest-countries",
      "most-populated-countries",
    ],
  },
  {
    slug: "countries-in-americas",
    metaTitle: "Countries in the Americas | Complete List with Stats",
    description:
      "Complete list of every country in North and South America with flag, capital, population, and area. From the US and Brazil to small Caribbean nations.",
    shortName: "Countries in the Americas",
    h1: "All Countries in the Americas",
    hubTitle: "Countries in the Americas",
    hubDescription:
      "Complete list of all countries in North and South America with capitals, population, and area.",
    listName: "All Countries in the Americas",
    listDescription:
      "Every country in North, Central, and South America, listed by population, with capital and area.",
    numberCaption: "countries and territories in the Americas",
    intro: [
      "The Americas span two continents, North America and South America, connected by the narrow isthmus of Central America and dotted with Caribbean island nations. Together they contain {n} countries and territories, stretching from Canada's Arctic north to the southern tip of Chile and Argentina.",
      "The United States and Brazil are the dominant nations by both population and economic output, but the Americas also include some of the world's smallest countries by area, like Saint Kitts and Nevis and Grenada. Latin America and the Caribbean represent one of the most culturally and linguistically diverse regions on Earth, with Spanish, Portuguese, English, French, and Dutch all spoken as official languages.",
      "Below is the complete list of countries in the Americas sorted by population, with each nation's capital, total population, and area.",
    ],
    quickFacts: [
      { kind: "sum", stat: "population", label: "everyone in the Americas" },
      { kind: "top", stat: "population", label: "the most populous" },
      { kind: "top", stat: "area-km2", label: "the largest" },
      { kind: "bottom", stat: "area-km2", label: "the smallest" },
    ],
    faq: [
      {
        q: "How many countries are in the Americas?",
        a: "There are 35 sovereign countries in the Americas, spanning North America, Central America, the Caribbean, and South America.",
      },
      {
        q: "Which is the largest country in the Americas?",
        a: "Canada is the largest country in the Americas by land area, covering approximately 10 million km². Brazil is the largest in South America.",
      },
    ],
    source: { kind: "continent", continent: "Americas", sovereign: 35 },
    seeAlso: [
      "countries-in-europe",
      "countries-in-asia",
      "countries-in-africa",
      "richest-countries",
      "most-populated-countries",
    ],
  },
  {
    slug: "most-visited-countries",
    metaTitle: "Most Visited Countries in the World (2024)",
    description:
      "The 50 most visited countries ranked by international tourist arrivals per year. From France to Thailand.",
    shortName: "Most Visited Countries",
    h1: "Most Visited Countries in the World",
    hubTitle: "Most Visited Countries",
    hubDescription: "The 50 most visited countries ranked by international tourist arrivals per year.",
    listName: "Most Visited Countries in the World",
    listDescription: "The 50 most visited countries ranked by international tourist arrivals per year.",
    numberCaption: "the most arrivals in a year",
    intro: [
      "France leads the world with over 100 million international tourist arrivals every year, followed closely by Spain and the United States. Tourism is a major GDP driver for many nations, funding infrastructure, creating jobs, and preserving cultural heritage.",
      "Top destinations span Europe, the Americas, and Asia. European countries dominate the list thanks to their proximity to one another and well-developed transport networks. In recent years, post-COVID recovery has varied widely, some destinations have rebounded fully while others are still catching up.",
      "This ranking is based on international tourist arrivals as reported by the World Tourism Organization (UNWTO) and national tourism agencies.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country is the most visited in the world?",
        a: "France is the most visited country in the world, welcoming over 100 million international tourists per year, driven by Paris, the French Riviera, and world-renowned cuisine and culture.",
      },
      {
        q: "What are the top 5 most visited countries?",
        a: "The top 5 most visited countries by international tourist arrivals are: 1. France, 2. Spain, 3. United States, 4. Turkey, 5. Italy.",
      },
    ],
    source: { kind: "stat", category: "tourism-arrivals" },
    seeAlso: ["richest-countries", "most-populated-countries", "highest-gdp-countries", "countries-in-europe"],
  },
  {
    slug: "highest-life-expectancy",
    metaTitle: "Highest Life Expectancy by Country (2024)",
    description:
      "Which countries have the longest life expectancy? Ranked list of 50 countries by average lifespan in years.",
    shortName: "Highest Life Expectancy",
    h1: "Countries with Highest Life Expectancy",
    hubTitle: "Highest Life Expectancy",
    hubDescription: "Countries with the longest average lifespan ranked by life expectancy in years.",
    listName: "Countries with Highest Life Expectancy",
    listDescription: "The 50 countries with the highest life expectancy at birth, in years.",
    numberCaption: "the longest lives on record",
    intro: [
      "Japan and Monaco consistently top the global life expectancy charts, with average lifespans exceeding 84 years. Healthcare quality, diet, socioeconomic stability, and lifestyle all play major roles in determining how long people live across different nations.",
      "The global average life expectancy is approximately 73 years, but the gap between the highest and lowest countries is staggering, more than 30 years separates the top from the bottom of this list.",
      "This ranking uses life expectancy at birth data from the World Bank and the World Health Organization.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest life expectancy?",
        a: "Monaco has the highest life expectancy in the world at over 86 years, followed closely by Japan and Liechtenstein. Exceptional healthcare, wealth, and lifestyle factors drive these numbers.",
      },
      {
        q: "What are the top 5 countries by life expectancy?",
        a: "The top 5 countries by life expectancy are: 1. Monaco (~86 years), 2. Japan (~84 years), 3. Liechtenstein (~84 years), 4. Switzerland (~84 years), 5. Singapore (~84 years).",
      },
    ],
    source: { kind: "stat", category: "life-expectancy" },
    seeAlso: ["most-populated-countries", "highest-fertility-rate", "richest-countries", "greenest-countries"],
  },
  {
    slug: "highest-gdp-countries",
    metaTitle: "Largest Economies in the World by GDP (2024)",
    description:
      "The 50 largest economies in the world ranked by total GDP in US dollars. USA, China, and Germany lead.",
    shortName: "Largest Economies by GDP",
    h1: "Largest Economies in the World by GDP",
    hubTitle: "Largest Economies by GDP",
    hubDescription: "The 50 largest economies in the world ranked by total GDP in US dollars.",
    listName: "Largest Economies in the World by GDP",
    listDescription: "The 50 largest economies ranked by total nominal GDP in current US dollars.",
    numberCaption: "the biggest economy on Earth",
    intro: [
      "The United States economy exceeds $25 trillion, making it the largest in the world by total GDP. China is the world's second-largest economy, and together the top 10 economies produce over 65% of global GDP.",
      "GDP (Gross Domestic Product) measures the total value of goods and services produced within a country in a given year. It is the most widely used indicator of economic size, though it does not capture income distribution or quality of life.",
      "The USA and China together represent roughly 40% of world GDP, while India is the fastest-growing large economy. This ranking uses nominal GDP in current US dollars from World Bank data.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest GDP in the world?",
        a: "The United States has the highest GDP in the world, exceeding $25 trillion. The US economy is driven by technology, finance, healthcare, and consumer spending.",
      },
      {
        q: "What are the top 5 largest economies by GDP?",
        a: "The 5 largest economies by GDP are: 1. United States ($25T+), 2. China ($18T+), 3. Germany ($4T+), 4. Japan ($4T+), 5. India ($3.5T+).",
      },
    ],
    source: { kind: "stat", category: "gdp" },
    seeAlso: ["richest-countries", "most-populated-countries", "biggest-military-spenders", "most-visited-countries"],
  },
  {
    slug: "most-forested-countries",
    metaTitle: "Most Forested Countries | Forest Coverage Ranking",
    description:
      "Countries with the highest percentage of forest coverage. Suriname, Gabon, and Micronesia lead with 90%+ forest cover.",
    shortName: "Most Forested Countries",
    h1: "Most Forested Countries in the World",
    hubTitle: "Most Forested Countries",
    hubDescription: "Countries with the highest percentage of forest coverage.",
    listName: "Most Forested Countries in the World",
    listDescription: "The 50 most forested countries ranked by percentage of land area covered by forest.",
    numberCaption: "the most land under forest",
    intro: [
      "Small tropical nations often have the highest percentage of forest coverage. Suriname, Gabon, and Micronesia each have over 90% of their land area covered by forest, making them some of the greenest places on Earth.",
      "Brazil has the largest total forest area in the world but does not rank at the top by percentage. The Amazon rainforest covers about 60% of Brazil's territory, yet large swathes of the country are savanna, wetland, and agricultural land.",
      "Forest coverage is critical for biodiversity, carbon sequestration, and climate regulation. This ranking is based on the percentage of total land area covered by forest, sourced from the World Bank and the FAO Global Forest Resources Assessment.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest forest coverage?",
        a: "Suriname has the highest percentage of forest coverage in the world, with over 90% of its land area covered by tropical rainforest. Gabon and Micronesia also exceed 90% forest cover.",
      },
      {
        q: "What are the top 5 most forested countries by percentage?",
        a: "The top 5 most forested countries by percentage of land covered are: 1. Suriname (~98%), 2. Micronesia (~92%), 3. Gabon (~90%), 4. Seychelles (~88%), 5. Palau (~88%).",
      },
    ],
    source: { kind: "stat", category: "forest-coverage-pct" },
    seeAlso: ["greenest-countries", "largest-countries", "countries-in-africa", "countries-in-americas"],
  },
  {
    slug: "most-connected-countries",
    metaTitle: "Most Connected Countries | Internet Usage by Country",
    description:
      "Countries ranked by percentage of population using the internet. See which nations are most digitally connected.",
    shortName: "Most Connected Countries",
    h1: "Most Connected Countries by Internet Usage",
    hubTitle: "Most Connected Countries",
    hubDescription: "Countries ranked by percentage of population using the internet.",
    listName: "Most Connected Countries by Internet Usage",
    listDescription: "The 50 most connected countries ranked by percentage of population using the internet.",
    numberCaption: "the largest share online",
    intro: [
      "Northern European and Gulf states lead the world in internet penetration, with several nations approaching 100% of the population online. Digital connectivity is closely correlated with economic development, education, and government investment in infrastructure.",
      "The digital divide between the most and least connected countries remains dramatic. While top-ranked nations have near-universal access, some countries in Sub-Saharan Africa and South Asia have internet penetration rates below 20%.",
      "This ranking uses the percentage of population using the internet, sourced from the International Telecommunication Union (ITU) and World Bank data.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest internet usage?",
        a: "Several small, wealthy nations approach 100% internet penetration. Northern European countries like Denmark, Iceland, and Luxembourg consistently rank among the most connected in the world.",
      },
      {
        q: "What are the top 5 countries by internet usage?",
        a: "The top 5 most connected countries by percentage of population online are: 1. Denmark (~99%), 2. Iceland (~99%), 3. Luxembourg (~99%), 4. Liechtenstein (~99%), 5. Bahrain (~99%).",
      },
    ],
    source: { kind: "stat", category: "internet-users-pct" },
    seeAlso: ["highest-gdp-countries", "richest-countries", "highest-life-expectancy", "greenest-countries"],
  },
  {
    slug: "highest-fertility-rate",
    metaTitle: "Highest Fertility Rates by Country | Birth Rate Ranking",
    description:
      "Countries ranked by fertility rate (births per woman). Sub-Saharan Africa leads while many developed nations are below replacement rate.",
    shortName: "Highest Fertility Rate",
    h1: "Countries with Highest Fertility Rate",
    hubTitle: "Highest Fertility Rate",
    hubDescription: "Countries ranked by fertility rate (births per woman).",
    listName: "Countries with Highest Fertility Rate",
    listDescription: "The 50 countries with the highest total fertility rate, measured in births per woman.",
    numberCaption: "the highest rate in the world",
    intro: [
      "Niger and Chad typically lead the world in fertility rates, with averages exceeding 6 births per woman. Sub-Saharan African countries dominate the top of this ranking, driven by a combination of cultural factors, limited access to contraception, and lower levels of female education.",
      "The global replacement rate is 2.1 births per woman, the level needed to maintain a stable population. Many European and East Asian countries now sit well below this threshold, leading to aging populations and shrinking workforces.",
      "This ranking uses total fertility rate data from the World Bank and the United Nations Population Division.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest fertility rate?",
        a: "Niger has the highest fertility rate in the world, with approximately 7 births per woman. High fertility in Niger is driven by limited access to contraception, early marriage, and low female education rates.",
      },
      {
        q: "What are the top 5 countries by fertility rate?",
        a: "The top 5 countries by fertility rate are: 1. Niger (~7.0), 2. Chad (~6.4), 3. Somalia (~6.1), 4. Mali (~6.0), 5. DR Congo (~6.0), all in Sub-Saharan Africa.",
      },
    ],
    source: { kind: "stat", category: "fertility-rate" },
    seeAlso: ["most-populated-countries", "highest-life-expectancy", "countries-in-africa", "countries-in-asia"],
  },
  {
    slug: "biggest-military-spenders",
    metaTitle: "Biggest Military Spenders | Defense Budget by Country",
    description:
      "Countries ranked by military spending as percentage of GDP. From conflict zones to NATO powers.",
    shortName: "Biggest Military Spenders",
    h1: "Countries with Highest Military Spending",
    hubTitle: "Biggest Military Spenders",
    hubDescription: "Countries ranked by military spending as percentage of GDP.",
    listName: "Countries with Highest Military Spending",
    listDescription: "The 50 countries ranked by military expenditure as a percentage of GDP.",
    numberCaption: "the largest share of GDP",
    intro: [
      "Conflict-affected states often top the list when measuring military spending as a percentage of GDP. Nations facing active security threats or regional instability dedicate a larger share of their economies to defense than the global average of roughly 2.2%.",
      "In absolute dollar terms, the picture is very different, the United States, China, and India dominate total military expenditure. The US alone spends more on defense than the next ten countries combined.",
      "This ranking uses military expenditure as a percentage of GDP, sourced from the Stockholm International Peace Research Institute (SIPRI) and World Bank data.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country spends the highest percentage of GDP on military?",
        a: "Countries affected by conflict, such as Ukraine and certain Middle Eastern nations, often spend the highest percentage of GDP on defense, sometimes exceeding 5-6% of GDP. In absolute dollar terms, the USA spends the most by far.",
      },
      {
        q: "What are the top 5 countries by military spending as percentage of GDP?",
        a: "The top 5 countries by military spending as a percentage of GDP typically include conflict-affected and strategically focused nations such as Ukraine, Saudi Arabia, Israel, Qatar, and Algeria, though exact rankings vary by year.",
      },
    ],
    source: { kind: "stat", category: "military-spending-pct" },
    seeAlso: ["highest-gdp-countries", "most-populated-countries", "largest-countries", "most-visited-countries"],
  },
  {
    slug: "greenest-countries",
    metaTitle: "Greenest Countries | Renewable Energy by Country",
    description:
      "Countries ranked by share of energy from renewable sources. Iceland, Norway, and Brazil lead the green energy transition.",
    shortName: "Greenest Countries",
    h1: "Greenest Countries by Renewable Energy Usage",
    hubTitle: "Greenest Countries",
    hubDescription: "Countries ranked by share of energy from renewable sources.",
    listName: "Greenest Countries by Renewable Energy Usage",
    listDescription: "The 50 greenest countries ranked by share of energy from renewable sources.",
    numberCaption: "the greenest energy mix",
    intro: [
      "Hydropower-rich nations dominate the renewable energy rankings. Iceland is nearly 100% powered by renewable sources, primarily geothermal and hydroelectric energy. Norway, Brazil, and New Zealand also derive large shares of their energy from renewables.",
      "Many developing nations also rank surprisingly high due to their reliance on biomass (wood, charcoal, agricultural waste) for energy. While this is technically renewable, it comes with deforestation and air quality concerns.",
      "This ranking uses the share of total energy consumption from renewable sources, based on data from the International Energy Agency (IEA) and World Bank.",
    ],
    quickFacts: [
      { kind: "row", rank: 2, label: "second" },
      { kind: "row", rank: 3, label: "third" },
      { kind: "row", rank: 10, label: "tenth" },
      { kind: "row", rank: 50, label: "fiftieth" },
    ],
    faq: [
      {
        q: "Which country has the highest renewable energy usage?",
        a: "Iceland is nearly 100% powered by renewable energy, primarily geothermal and hydropower. Norway and Paraguay also derive the vast majority of their energy from renewable sources.",
      },
      {
        q: "What are the top 5 countries by renewable energy share?",
        a: "The top 5 greenest countries by renewable energy share are: 1. Iceland (~90%+), 2. Norway (~70%+), 3. Brazil (~45%+), 4. New Zealand (~40%+), 5. Sweden (~55%+), though exact rankings depend on the metric used.",
      },
    ],
    source: { kind: "stat", category: "renewable-energy-pct" },
    seeAlso: ["most-forested-countries", "most-connected-countries", "highest-life-expectancy", "richest-countries"],
  },
];

/** Sitemap and generateStaticParams read this (blueprint 7.12). */
export const LIST_SLUGS: readonly string[] = LISTS.map((l) => l.slug);

/** scripts/build-data-timestamps.ts reads this: which data each list depends on. */
export const LIST_SOURCES: Record<string, ListSource> = Object.fromEntries(
  LISTS.map((l) => [l.slug, l.source]),
);

export function getList(slug: string): ListContent | null {
  return LISTS.find((l) => l.slug === slug) ?? null;
}
