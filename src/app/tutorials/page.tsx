import { PublicLayout } from "@/components/public-layout"

export default function PublicTutorialsPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">Watch Tutorial</h1>
            <p className="text-muted-foreground mt-2">Learn how to use TB360 with this step-by-step training video.</p>
          </div>
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/zrFno1ygJm8"
              title="TB360 Training Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="text-center mt-6">
            <a
              href="https://youtu.be/zrFno1ygJm8?si=4jyaa5Jkn_yVr5nK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-600 font-medium"
            >
              Open in YouTube
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
