const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank360.com"

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TrustBank360",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.svg`,
    description: "Enterprise fintech platform for money transfer and remittance businesses across Africa and beyond.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+211-924-440-899",
      contactType: "customer service",
      email: "support@trustbank360.com",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Juba",
      addressCountry: "SS",
    },
    sameAs: ["#", "#", "#"],
  }
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TrustBank360",
    applicationCategory: "FinancialApplication",
    operatingSystem: "Web",
    description: "Multi-company money transfer and remittance management platform.",
    offers: [
      { "@type": "Offer", price: "10", priceCurrency: "USD", description: "Small Company Plan" },
      { "@type": "Offer", price: "30", priceCurrency: "USD", description: "Medium Company Plan" },
      { "@type": "Offer", price: "60", priceCurrency: "USD", description: "Enterprise Plan" },
    ],
  }
}

export function techArticleSchema(title: string, description: string, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url: `${siteUrl}${pageUrl}`,
    author: { "@type": "Organization", name: "TrustBank360" },
    datePublished: "2026-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  }
}
