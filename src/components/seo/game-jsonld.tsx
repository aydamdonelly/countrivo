interface GameJsonLdProps {
  name: string;
  description: string;
  url: string;
  genre: string;
  playMode: string;
}

export function GameJsonLd({ name, description, url, genre, playMode }: GameJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    url: `https://countrivo.com${url}`,
    genre,
    playMode,
    applicationCategory: "Game",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Countrivo",
      url: "https://countrivo.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
