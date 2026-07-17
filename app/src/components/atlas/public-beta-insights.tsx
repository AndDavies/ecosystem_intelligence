"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function PublicBetaInsights() {
  return (
    <>
      <Analytics
        beforeSend={(event: BeforeSendEvent) => {
          if (event.url.includes("/admin") || event.url.includes("/review")) return null;
          const url = new URL(event.url);
          url.search = "";
          url.hash = "";
          return { ...event, url: url.toString() };
        }}
      />
      <SpeedInsights sampleRate={0.5} />
    </>
  );
}
