import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Categories from '@/components/sections/Categories'
import Listings from '@/components/sections/Listings'
import MapSection from '@/components/sections/MapSection'
import AISection from '@/components/sections/AISection'
import Projects from '@/components/sections/Projects'
import Services from '@/components/sections/Services'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <Hero />
        <Stats />
        <Categories />
        <Listings />
        <MapSection />
        <AISection />
        <Projects />
        <Services />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
