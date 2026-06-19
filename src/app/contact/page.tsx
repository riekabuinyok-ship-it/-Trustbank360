import Image from "next/image"
import Link from "next/link"
import { IMAGES } from "@/lib/images"
import { PublicLayout } from "@/components/public-layout"

export default function ContactPage() {
  return (
    <PublicLayout>
      <section className="relative min-h-[45vh] flex items-center">
        <div className="absolute inset-0">
          <Image src={IMAGES.pages.contactHero} alt="Contact" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Contact Us</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">Get in touch with our team. We are here to help.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold">Email</h3>
                <a href="mailto:support@trustbank360.com" className="text-muted-foreground hover:text-primary transition-colors">support@trustbank360.com</a>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <p className="text-muted-foreground">+211 123 456 789</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Address</h3>
                <p className="text-muted-foreground">Juba, South Sudan</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Office Hours</h3>
                <p className="text-muted-foreground">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-muted-foreground">Saturday: 9:00 AM - 2:00 PM</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                    <input id="name" type="text" placeholder="John Deng" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input id="email" type="email" placeholder="you@company.com" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">Company</label>
                  <input id="company" type="text" placeholder="Your company name" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <textarea id="message" rows={5} placeholder="How can we help you?" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none" />
                </div>
                <button type="submit" className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
