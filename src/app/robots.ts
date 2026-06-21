import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank360.com"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/about", "/contact", "/help", "/privacy", "/terms", "/tutorials", "/exchange-rates", "/track"],
        disallow: ["/dashboard", "/admin", "/settings", "/api", "/company", "/platform", "/force-change-password", "/forgot-password", "/onboarding", "/login", "/signup", "/offline"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
