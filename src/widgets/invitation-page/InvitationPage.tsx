import type { Guest } from "@/shared/config";
import { Splash } from "@/widgets/splash";
import { Navbar } from "@/widgets/navbar";
import { Hero } from "@/widgets/hero";
import { PersonalInvitation } from "@/widgets/personal-invitation";
import { OurStory } from "@/widgets/our-story";
import { Timeline } from "@/widgets/timeline";
import { Location } from "@/widgets/location";
import { DressCode } from "@/widgets/dress-code";
import { Gifts } from "@/widgets/gifts";
import { RSVP } from "@/widgets/rsvp";
import { Footer } from "@/widgets/footer";

interface InvitationPageProps {
  guest?: Guest;
  showSplash?: boolean;
}

export function InvitationPage({
  guest,
  showSplash = true,
}: InvitationPageProps) {
  return (
    <>
      {showSplash ? <Splash /> : null}
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative scroll-mt-24 outline-none">
        <Hero />
        <PersonalInvitation guest={guest} />
        <OurStory />
        <Timeline />
        <Location />
        <DressCode />
        <Gifts />
        <RSVP guest={guest} />
      </main>
      <Footer />
    </>
  );
}
