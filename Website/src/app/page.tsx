import {
  Hero,
  TheProblem,
  HowItWorks,
  Features,
  PrivacyFirst,
  CTAButton,
  Footer,
  Support,
} from "@/components/sections";
import Navbar from "@/components/ui/navbar";
import React from "react";

const HomePage = () => {
  return (
    <main className="overflow-x-clip">
      <Navbar />
      <Hero />
      <TheProblem />
      <HowItWorks />
      <Features />
      <Support />
      
      <PrivacyFirst />
      <CTAButton />
      <Footer />
    </main>
  );
};

export default HomePage;
