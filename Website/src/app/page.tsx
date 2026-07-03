import {
  Hero,
  TheProblem,
  HowItWorks,
  Features,
  PrivacyFirst,
  CTAButton,
  Footer,
} from "@/components/sections";
import Navbar from "@/components/ui/navbar";
import React from "react";

const HomePage = () => {
  return (
    <main>
      <Navbar />
      <Hero />
      <TheProblem />
      <HowItWorks />
      <Features />
      <PrivacyFirst />
      <CTAButton />
      <Footer />
    </main>
  );
};

export default HomePage;
