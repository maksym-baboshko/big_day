import { buildRememberVisitedRouteScript } from "@/shared/lib/visited-route";
import Script from "next/script";

export function VisitedRouteScript() {
  return (
    <Script id="remember-last-visited-route" strategy="beforeInteractive">
      {buildRememberVisitedRouteScript()}
    </Script>
  );
}
