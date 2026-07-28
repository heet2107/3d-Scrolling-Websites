import fs from "node:fs";
import path from "node:path";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import Credentials from "@/components/Credentials";
import Contact from "@/components/Contact";

export default function Home() {
  // Detect the real headshot at build time; About falls back to a monogram card.
  const hasPortrait = fs.existsSync(
    path.join(process.cwd(), "public/media/headshot.jpg")
  );
  return (
    <SmoothScroll>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <About hasPortrait={hasPortrait} />
        <Projects />
        <Experience />
        <Skills />
        <Credentials />
      </main>
      <Contact />
    </SmoothScroll>
  );
}
