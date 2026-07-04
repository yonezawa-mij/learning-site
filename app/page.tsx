import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CoursesPreview } from "@/components/CoursesPreview";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CoursesPreview />
        <Features />
      </main>
      <Footer />
    </>
  );
}
