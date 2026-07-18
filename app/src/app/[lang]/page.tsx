import HomeMain from '@/components/HomeMain'

// Refresh featured listings from DB hourly (ISR).
export const revalidate = 3600

export default function Home() {
  return <HomeMain />
}
