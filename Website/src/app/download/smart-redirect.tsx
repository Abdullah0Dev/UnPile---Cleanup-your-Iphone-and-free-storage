// import { redirect } from "next/navigation";
// redirect("https://apps.apple.com/us/app/unpile-clean-up-photos/id6813002849");
// app/download/smart-redirect.tsx
"use client";
import { useEffect } from "react";

export default function SmartRedirect({ url }: { url: string }) {
  useEffect(() => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.replace(url);
    }
  }, [url]);
  return null;
}