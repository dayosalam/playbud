import { AppFooter } from "@/components/AppFooter";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body:
      "By accessing or using PlayBud you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.",
  },
  {
    title: "2. Platform Usage",
    body:
      "You may only create games or join sessions if you are at least 18 years old and can form a binding contract. All account information you provide must be accurate and kept up to date.",
  },
  {
    title: "3. Game Hosting",
    body:
      "Organisers are responsible for the accuracy of session details, securing venues, and complying with local regulations. PlayBud may review or remove listings that violate community standards.",
  },
  {
    title: "4. Payments & Fees",
    body:
      "Where applicable, session fees are disclosed before you confirm a booking. All payments are processed securely via our authorised payment partners.",
  },
  {
    title: "5. Cancellations",
    body:
      "Each game clearly states its cancellation window. Missing a stated cut-off may result in forfeited fees or a mark on organiser reputation.",
  },
  {
    title: "6. Liability",
    body:
      "PlayBud facilitates community sports but does not assume responsibility for injuries, venue issues, or conduct of other players. Participate at your own risk.",
  },
  {
    title: "7. Changes to the Terms",
    body:
      "We may update these Terms periodically. Continued use of PlayBud after changes become effective constitutes acceptance of the updated Terms.",
  },
];

const Terms = () => {
  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Terms of Service
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

export default Terms;
