"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBrain } from "@tabler/icons-react";
import { Rocket, Mail, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const footerSections = [
    {
      title: "Our Services",
      links: [
        { name: "Comprehensive Accounting", href: "/services/accounting" },
        { name: "Tax Planning & Compliance", href: "/services/tax-planning" },
        { name: "New Company Registration", href: "/services/company-registration" },
        { name: "Audits & Business Advisory", href: "/services/advisory" },
      ],
    },
    {
      title: "Who We Help",
      links: [
        { name: "Self-Employed & Sole Traders", href: "/services/self-employed" },
        { name: "Small Businesses & SMEs", href: "/services/smes" },
        { name: "Start-Ups & New Companies", href: "/services/startups" },
        { name: "Visa Applications", href: "/services/visa-support" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "Who We Are", href: "/about" },
        { name: "Latest Blogs", href: "/blog" },
        { name: "Book a Free Consultation", href: "/contact" },
        { name: "FAQs", href: "/faqs" },
      ],
    },
  ];

  return (
    <footer className="w-full border-t border-border-dark bg-background-dark">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex p-1 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IconBrain className="w-6.5 rounded-full h-6.5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground-inverted">
                AGW Accountants Ltd
              </span>
            </div>
            <p className="text-[#94a3b8] max-w-md">
              Chartered accountants and ACCA professionals with Big 4
              experience. We help businesses, individuals, and the
              self-employed across the UK stay compliant, save money, and
              grow with confidence.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://Rocket.com/company/agw-accountants" aria-label="Rocket">
                  <Rocket className="h-4 w-4 text-[#94a3b8]" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="tel:+440000000000" aria-label="Phone">
                  <Phone className="h-4 w-4 text-[#94a3b8]" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="mailto:contact@agwaccountants.co.uk" aria-label="Email">
                  <Mail className="h-4 w-4 text-[#94a3b8]" />
                </a>
              </Button>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h4 className="font-semibold text-foreground-inverted">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-[#94a3b8] hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-border-dark" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#94a3b8]">
            © 2026 AGW Accountants Limited. Company No. 16999181. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/privacy-policy"
              className="text-[#94a3b8] hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-[#94a3b8] hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}