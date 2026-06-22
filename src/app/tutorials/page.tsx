import Link from "next/link"
import { PublicLayout } from "@/components/public-layout"
import { tutorials } from "@/lib/tutorials"

export default function TutorialsHubPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold">Tutorials</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Step-by-step guides to help you get the most out of TRUSTBANK360. Watch the full training video or follow each guide below.</p>
          </div>

          {/* Full Video */}
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shadow-lg mb-12">
            <iframe
              src="https://www.youtube.com/embed/zrFno1ygJm8"
              title="TRUSTBANK360 Training Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Tutorial Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map((t) => (
              <Link
                key={t.slug}
                href={`/tutorials/${t.slug}`}
                className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-3">{t.icon}</div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{t.steps.length} steps</span>
                  <span>·</span>
                  <span>{t.duration}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
