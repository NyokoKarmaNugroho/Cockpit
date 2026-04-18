import { FormEvent, useState } from "react";

export function Newsletter() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = new FormData(form).get("email");
    const email = typeof raw === "string" ? raw.trim() : "";
    if (!email) return;

    const subject = encodeURIComponent("Cockpit — newsletter / product updates");
    const body = encodeURIComponent(
      `Please add this address for Cockpit product notes and releases:\n\n${email}\n`,
    );
    window.location.href = `mailto:support@daemonprotocol.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section
      id="newsletter"
      className="scroll-mt-24 relative overflow-hidden border-t border-ink/10 bg-ink"
    >
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
          <div>
            <h2 className="font-serif text-3xl font-normal tracking-tight text-canvas sm:text-4xl">
              Stay updated
            </h2>
            <p className="mt-4 text-lg text-canvas/80">
              Product notes, methodology posts, and release highlights—no spam, unsubscribe anytime.
            </p>
          </div>
          <div>
            {sent ? (
              <p className="border border-canvas/25 bg-canvas/10 px-6 py-8 text-canvas">
                Thanks. We&apos;ll be in touch when there&apos;s something worth your inbox.
              </p>
            ) : (
              <form onSubmit={onSubmit} aria-describedby="newsletter-mailto-hint">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                  <label className="sr-only" htmlFor="newsletter-email">
                    Email address
                  </label>
                  <div className="min-w-0 flex-1 border-b border-canvas/45 pb-2 focus-within:border-canvas">
                    <input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Enter email address…"
                      className="w-full bg-transparent text-base text-canvas placeholder:text-canvas/50 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center text-2xl font-light text-canvas transition-opacity hover:opacity-80"
                    aria-label="Open email to send request to support@daemonprotocol.com"
                  >
                    →
                  </button>
                </div>
                <p id="newsletter-mailto-hint" className="mt-3 text-sm text-canvas/55">
                  Opens your mail app to send a message to{" "}
                  <a
                    href="mailto:support@daemonprotocol.com"
                    className="text-canvas/85 underline decoration-canvas/35 underline-offset-2 transition hover:decoration-canvas/70"
                  >
                    support@daemonprotocol.com
                  </a>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
