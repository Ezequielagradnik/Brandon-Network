import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import LogoMarquee from "@/components/LogoMarquee";
import LandingCTA from "@/components/LandingCTA";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <AboutSection />
      <LogoMarquee />
      <LandingCTA />
    </main>
  );
}
