import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for this personal website.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-warm,#FFFFFF)] text-[var(--color-dark,#20233F)] px-6 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="border-b border-[var(--color-dark-muted,#4B4E6A)]/15 pb-6">
          <h1 className="font-pixel text-heading sm:text-display font-bold tracking-tight text-[var(--color-dark,#20233F)]">
            Privacy Policy
          </h1>
          <p className="mt-2 font-pixel text-meta text-[var(--color-dark-muted,#4B4E6A)]">
            Last updated: October 2026
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            1. Personal, Non-Commercial Project
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            This is an entirely personal, non-commercial website created as a handcrafted project.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            2. Spotify Integration
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            When you sign in with Spotify, session cookies are stored in your browser. These are used only to play music and show your own listening data within the player. Authentication tokens are kept private and are never shared with anyone.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            3. Memories &amp; Lyrics Edits
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            Memories and lyrics edits are stored in the site’s database and tied to the Spotify account that created them.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            4. Pinterest Slideshow
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            The site owner’s own board is read by the owner to pick images for a slideshow. No visitor’s Pinterest data is accessed.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            5. No Analytics, Advertising, or Selling of Data
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            There are no analytics, tracking scripts, or advertising networks on this site. Your data is never sold or shared.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-pixel text-title font-bold text-[var(--color-dark,#20233F)]">
            6. Contact
          </h2>
          <p className="font-pixel text-body text-[var(--color-dark-muted,#4B4E6A)] leading-relaxed">
            For questions about this policy or your data, you can reach out to{" "}
            <a
              href="mailto:CONTACT_EMAIL"
              className="text-[var(--color-pink,#FF8FB3)] hover:underline font-semibold"
            >
              CONTACT_EMAIL
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
