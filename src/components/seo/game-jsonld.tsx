interface GameJsonLdProps {
  name: string;         // full name like "Flag Quiz | Countrivo"
  description: string;
  url: string;          // relative path like "/games/flag-quiz"
  genre: string;
  playMode: string;
  title?: string;       // clean title like "Flag Quiz" for breadcrumb
  rules?: string[];     // rules for FAQPage
}

export function GameJsonLd({ name, description, url, genre, playMode, title, rules }: GameJsonLdProps) {
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://countrivo.com" },
        { "@type": "ListItem", position: 2, name: "Games", item: "https://countrivo.com/games" },
        { "@type": "ListItem", position: 3, name: title ?? name, item: `https://countrivo.com${url}` },
      ],
    },
    {
      "@type": "VideoGame",
      name,
      description,
      url: `https://countrivo.com${url}`,
      genre,
      playMode,
      applicationCategory: "Game",
      operatingSystem: "Web Browser",
      isAccessibleForFree: true,
      inLanguage: "en-US",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Organization", name: "Countrivo", url: "https://countrivo.com" },
    },
  ];

  if (rules && rules.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: rules.map((rule, i) => ({
        "@type": "Question",
        name: i === 0 ? `How do you play ${title ?? name}?` : `Step ${i + 1}: What happens next?`,
        acceptedAnswer: { "@type": "Answer", text: rule },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
