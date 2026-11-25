// Country Draft roster additions, November 2026 (pool version 4, live from 2026-11-27 Berlin).
// Source: reports/2026-11-25/design-audit, key "4". Applied by scripts/add-draft-figures.mjs.
//
// - name: the display name. The slug derived from it keys portraits, credits and records.
// - wiki: the English Wikipedia title when the display name is ambiguous.
// - portraitFile: a pinned Wikimedia Commons file, used when the article's lead image is not
//   under a free licence (GFDL, OGL, KOGL, "European Parliament") or is not a usable portrait.
// - born: checked against the 2008 cut-off so nobody under 18 is added.
//
// Entries without category and note already exist in src/data/figures.json and only gain the
// optional fields given here. People who are living were checked for serious controversy;
// candidates the audit marked as divisive, under 18 or of disputed nationality were left out
// (Neymar, Macky Sall, Akon, Lula, Pope Francis, Lamine Yamal).
export const ADDITIONS = [
  // New Zealand. Jacinda Ardern, Richie McCaw and Michael Joseph Savage already have portraits.
  { name: "Lorde", iso3: "NZL", born: 1996 },
  { name: "Peter Jackson", iso3: "NZL", born: 1961 },
  { name: "Taika Waititi", iso3: "NZL", category: "screen", era: "modern", note: "director of Jojo Rabbit and Thor: Ragnarok", born: 1975 },
  { name: "Edmund Hillary", iso3: "NZL", born: 1919 },
  { name: "Ernest Rutherford", iso3: "NZL", born: 1871 },

  // Norway. Thor Heyerdahl and Henrik Ibsen already have portraits.
  { name: "Gro Harlem Brundtland", iso3: "NOR", category: "leaders", era: "modern", note: "prime minister of Norway and head of the WHO", born: 1939 },
  { name: "Edvard Grieg", iso3: "NOR", born: 1843 },
  { name: "Kygo", iso3: "NOR", category: "musicians", era: "modern", note: "DJ and producer of tropical house", born: 1991 },
  { name: "Roald Amundsen", iso3: "NOR", born: 1872 },
  { name: "Magnus Carlsen", iso3: "NOR", born: 1990 },
  { name: "Fridtjof Nansen", iso3: "NOR", born: 1861 },
  { name: "Erling Haaland", iso3: "NOR", category: "athletes", era: "modern", note: "striker and record Premier League scorer", born: 2000 },

  // Belgium. Kim Clijsters already has a portrait.
  { name: "Stromae", iso3: "BEL", category: "musicians", era: "modern", note: "singer of Alors on danse and Papaoutai", born: 1985 },
  { name: "Jean-Claude Van Damme", iso3: "BEL", category: "screen", era: "modern", note: "martial arts film actor", born: 1960 },
  { name: "Georges Lemaître", iso3: "BEL", born: 1894 },
  { name: "Adolphe Sax", iso3: "BEL", category: "scientists", era: "historical", note: "inventor of the saxophone", born: 1814, portraitFile: "Adolphe Sax 3.jpg" },
  { name: "Andreas Vesalius", iso3: "BEL", born: 1514, portraitFile: "Vesalius Fabrica portrait.jpg" },
  { name: "Eddy Merckx", iso3: "BEL", born: 1945 },
  { name: "Kevin De Bruyne", iso3: "BEL", category: "athletes", era: "modern", note: "playmaker for Belgium and Manchester City", born: 1991 },

  // Jamaica. Marcus Garvey and Shelly-Ann Fraser-Pryce already have portraits.
  { name: "Bob Marley", iso3: "JAM", born: 1945 },
  { name: "Sean Paul", iso3: "JAM", category: "musicians", era: "modern", note: "dancehall singer of Temperature", born: 1973 },
  { name: "Usain Bolt", iso3: "JAM", born: 1986, portraitFile: "Usain Bolt with NX300-3.jpg" },
  { name: "Michael Manley", iso3: "JAM", category: "leaders", era: "historical", note: "prime minister of Jamaica in the 1970s and 80s", born: 1924, portraitFile: "Michael Manley 1977.jpg" },

  // Senegal. Mariama Bâ, Youssou N'Dour and Ousmane Sembène already have portraits.
  { name: "Léopold Sédar Senghor", iso3: "SEN", born: 1906 },
  { name: "Sadio Mané", iso3: "SEN", born: 1992 },

  // Ghana. Kofi Annan and Abedi Pele already have portraits.
  { name: "Kwame Nkrumah", iso3: "GHA", born: 1909, portraitFile: "Kwame Nkrumah (JFKWHP-AR6409-A).jpg" },
  { name: "John Kufuor", iso3: "GHA", category: "leaders", era: "modern", note: "president of Ghana from 2001 to 2009", born: 1938 },
  { name: "Michael Essien", iso3: "GHA", category: "athletes", era: "modern", note: "midfielder for Chelsea and Ghana", born: 1982 },
  { name: "Sarkodie", iso3: "GHA", category: "musicians", era: "modern", note: "rapper of Ghanaian hiplife", born: 1985, wiki: "Sarkodie (rapper)" },

  // Denmark. Niels Bohr and Hans Christian Andersen already have portraits.
  { name: "Margrethe II", iso3: "DNK", category: "leaders", era: "modern", note: "queen of Denmark from 1972 to 2024", born: 1940, portraitFile: "Dronning Margrethe II (crop).jpg" },
  { name: "Mads Mikkelsen", iso3: "DNK", born: 1965 },
  { name: "Tycho Brahe", iso3: "DNK", born: 1546, portraitFile: "Tycho Brahe.JPG" },
  { name: "Caroline Wozniacki", iso3: "DNK", category: "athletes", era: "modern", note: "tennis player and former world number one", born: 1990 },
  { name: "Ole Kirk Christiansen", iso3: "DNK", category: "founders", era: "historical", note: "founded the LEGO toy company", born: 1891 },

  // Switzerland. Henri Nestlé already has a portrait; the audit lists these as reserves.
  { name: "Roger Federer", iso3: "CHE", born: 1981 },
  { name: "Carl Jung", iso3: "CHE", born: 1875, portraitFile: "CGJung.jpg" },
  { name: "Henry Dunant", iso3: "CHE", born: 1828 },
  { name: "Leonhard Euler", iso3: "CHE", born: 1707 },

  // Brazil
  { name: "Ronaldo", iso3: "BRA", born: 1976, wiki: "Ronaldo (Brazilian footballer)" },
  { name: "Marta", iso3: "BRA", born: 1986, wiki: "Marta (footballer)" },
  { name: "Anitta", iso3: "BRA", category: "musicians", era: "modern", note: "pop and funk singer of Envolver", born: 1993, wiki: "Anitta (singer)" },
  { name: "Paulo Coelho", iso3: "BRA", born: 1947 },
  { name: "Gilberto Gil", iso3: "BRA", born: 1942 },

  // Argentina
  { name: "Lionel Messi", iso3: "ARG", born: 1987 },
  { name: "Jorge Luis Borges", iso3: "ARG", born: 1899 },
  { name: "Ricardo Darín", iso3: "ARG", born: 1957 },
  { name: "Manu Ginóbili", iso3: "ARG", category: "athletes", era: "modern", note: "basketball guard with four NBA titles", born: 1977 },

  // Spain
  { name: "Rafael Nadal", iso3: "ESP", born: 1986 },
  { name: "Carlos Alcaraz", iso3: "ESP", category: "athletes", era: "modern", note: "tennis player and Grand Slam champion", born: 2003 },
  { name: "Rosalia", iso3: "ESP", born: 1992, wiki: "Rosalía" },
  { name: "Pedro Almodóvar", iso3: "ESP", born: 1949 },
  { name: "Antonio Banderas", iso3: "ESP", category: "screen", era: "modern", note: "actor of Spanish and Hollywood film", born: 1960 },

  // France
  { name: "Kylian Mbappé", iso3: "FRA", category: "athletes", era: "modern", note: "striker and World Cup winner in 2018", born: 1998 },
  { name: "Bernard Arnault", iso3: "FRA", born: 1949 },
  { name: "Thomas Pesquet", iso3: "FRA", category: "scientists", era: "modern", note: "astronaut who flew to the space station", born: 1978 },
  { name: "Omar Sy", iso3: "FRA", category: "screen", era: "modern", note: "actor of The Intouchables and Lupin", born: 1978 },
  { name: "Marion Cotillard", iso3: "FRA", category: "screen", era: "modern", note: "actor and Academy Award winner", born: 1975 },

  // United Kingdom
  { name: "Lewis Hamilton", iso3: "GBR", born: 1985, portraitFile: "Lewis Hamilton Silverstone 2018 (cropped).jpg" },
  { name: "Ed Sheeran", iso3: "GBR", category: "musicians", era: "modern", note: "singer and songwriter of Shape of You", born: 1991 },
  { name: "Dua Lipa", iso3: "GBR", category: "musicians", era: "modern", note: "pop singer of Levitating", born: 1995 },
  { name: "Tim Berners-Lee", iso3: "GBR", category: "scientists", era: "modern", note: "inventor of the World Wide Web", born: 1955 },
  { name: "Emma Watson", iso3: "GBR", category: "screen", era: "modern", note: "actor who played Hermione Granger", born: 1990 },
  { name: "David Attenborough", iso3: "GBR", born: 1926, portraitFile: "David Attenborough 2019.jpg" },

  // United States
  { name: "Taylor Swift", iso3: "USA", category: "musicians", era: "modern", note: "singer and songwriter of the Eras Tour", born: 1989 },
  { name: "Bill Gates", iso3: "USA", category: "founders", era: "modern", note: "co-founder of Microsoft", born: 1955 },
  { name: "LeBron James", iso3: "USA", category: "athletes", era: "modern", note: "basketball forward and NBA scoring leader", born: 1984 },

  // South Korea
  { name: "Psy", iso3: "KOR", category: "musicians", era: "modern", note: "singer of Gangnam Style", born: 1977, wiki: "Psy (entertainer)" },
  { name: "Kim Yuna", iso3: "KOR", born: 1990, wiki: "Yuna Kim", portraitFile: "Yuna Kim 2024.jpg" },
  { name: "Han Kang", iso3: "KOR", born: 1970 },
  { name: "Park Chan-wook", iso3: "KOR", born: 1963 },
  { name: "Kim Dae-jung", iso3: "KOR", born: 1924, portraitFile: "Kim Dae-jung (Cropped).png" },

  // Nigeria
  { name: "Burna Boy", iso3: "NGA", born: 1991 },
  { name: "Wizkid", iso3: "NGA", category: "musicians", era: "modern", note: "Afrobeats singer of Essence", born: 1990, portraitFile: "Wizkid at Iyanya's album launch concert, 2013 (cropped).jpg" },
  { name: "Wole Soyinka", iso3: "NGA", born: 1934 },
  { name: "Chinua Achebe", iso3: "NGA", born: 1930 },
  { name: "Ngozi Okonjo-Iweala", iso3: "NGA", category: "founders", era: "modern", note: "finance minister and head of the WTO", born: 1954 },
];
