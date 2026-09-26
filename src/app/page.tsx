import { Runtime } from "@/components/Runtime";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Stack } from "@/components/sections/Stack";
import { Work } from "@/components/sections/Work";
import { OpenSource } from "@/components/sections/OpenSource";
import { Journey } from "@/components/sections/Journey";
import { Contact } from "@/components/sections/Contact";
import { Motion } from "@/components/ui/Motion";

export default function Home() {
  return (
    <Motion>
      <a href="#about" className="skip-link">
        Skip to content
      </a>
      <Runtime />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <Stack />
        <Work />
        <OpenSource />
        <Journey />
        <Contact />
      </main>
    </Motion>
  );
}
