import fs from "node:fs";
import path from "node:path";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import OrbitSequence from "@/components/OrbitSequence";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import Credentials from "@/components/Credentials";
import Contact from "@/components/Contact";

export default function Home() {
  // Prefer a user-supplied headshot; fall back to the cinematic studio poster.
  const hasHeadshot = fs.existsSync(
    path.join(process.cwd(), "public/media/headshot.jpg")
  );
  const hasPoster = fs.existsSync(
    path.join(process.cwd(), "public/media/poster.jpg")
  );
  const hasPortrait = hasHeadshot || hasPoster;
  const portraitSrc = hasHeadshot ? "/media/headshot.jpg" : "/media/poster.jpg";
  return (
    <SmoothScroll>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <About hasPortrait={hasPortrait} portraitSrc={portraitSrc} />
        <OrbitSequence />
        <Projects />
        <Experience />
        <Skills />
        <Credentials />
      </main>
      <Contact />
    </SmoothScroll>
  );
}
