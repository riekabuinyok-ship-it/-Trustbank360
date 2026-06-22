import { notFound } from "next/navigation"
import Link from "next/link"
import { PublicLayout } from "@/components/public-layout"
import { tutorials, getTutorial } from "@/lib/tutorials"

export function generateStaticParams() {
  return tutorials.map((t) => ({ slug: t.slug }))
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tutorial = getTutorial(slug)
  if (!tutorial) notFound()

  const currentIndex = tutorials.findIndex((t) => t.slug === slug)
  const prev = currentIndex > 0 ? tutorials[currentIndex - 1] : null
  const next = currentIndex < tutorials.length - 1 ? tutorials[currentIndex + 1] : null

  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/tutorials" className="hover:text-primary transition-colors">Tutorials</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{tutorial.title}</span>
          </div>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="text-3xl">{tutorial.icon}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{tutorial.title}</h1>
              <p className="text-muted-foreground mt-2">{tutorial.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{tutorial.steps.length} steps</span>
                <span>·</span>
                <span>{tutorial.duration}</span>
              </div>
            </div>
          </div>

          {/* Video Embed */}
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shadow-sm mb-8">
            <iframe
              src={`https://www.youtube.com/embed/zrFno1ygJm8?start=${currentIndex * 30}`}
              title="TRUSTBANK360 Training Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            {tutorial.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < tutorial.steps.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {tutorial.tips.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800 mb-8">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">💡 Pro Tips</h3>
              <ul className="space-y-1.5">
                {tutorial.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Link */}
          {tutorial.relatedLink && (
            <div className="text-center mb-8">
              <Link href={tutorial.relatedLink} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-600 transition-colors text-sm">
                {tutorial.relatedLabel || "Go to Page"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          )}

          {/* Prev / Next Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div>
              {prev && (
                <Link href={`/tutorials/${prev.slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {prev.title}
                </Link>
              )}
            </div>
            <div>
              {next && (
                <Link href={`/tutorials/${next.slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  {next.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
