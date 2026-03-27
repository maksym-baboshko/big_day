import { buildRememberVisitedRouteScript } from "@/shared/lib/visited-route";
import Script from "next/script";

interface VisitedRouteScriptProps {
  route: string;
}

export function VisitedRouteScript({ route }: VisitedRouteScriptProps) {
  return (
    <Script id="remember-last-visited-route" strategy="beforeInteractive">
      {buildRememberVisitedRouteScript(route)}
    </Script>
  );
}
