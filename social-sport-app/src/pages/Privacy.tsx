import { AppFooter } from "@/components/AppFooter";

const sections = [
  {
    title: "1. Information We Collect",
    body:
      "We collect information you provide when creating an account, hosting a game, or joining a session. This includes contact details, preferred city, and optional profile data.",
  },
  {
    title: "2. How We Use Your Data",
    body:
      "Your information is used to personalise your experience, manage bookings, send notifications, and improve PlayBud. We never sell personal data to third parties.",
  },
  {
    title: "3. Sharing & Disclosure",
    body:
      "We only share data with trusted partners (e.g., payment processors) when necessary to deliver our services, comply with law, or protect user safety.",
  },
  {
    title: "4. Data Security",
    body:
      "PlayBud uses industry-standard encryption and access controls. While we strive to protect your data, no method of transmission over the internet is completely secure.",
  },
  {
    title: "5. Your Choices",
    body:
      "You may update profile information at any time via the app. To delete your account or request data export, contact support at hello@playbud.app.",
  },
  {
    title: "6. Cookies",
    body:
      "We use cookies and similar technologies to keep you signed in, remember preferences, and measure product performance.",
  },
  {
    title: "7. Updates to this Policy",
    body:
      "We may revise this Privacy Policy periodically. Material changes will be communicated via email or in-app notifications.",
  },
];

const Privacy = () => {
  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </header>

        <div className="space-y-8 rounded-3xl border border-border bg-card/60 p-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
      <AppFooter />
    </>
  );
};

export default Privacy;
