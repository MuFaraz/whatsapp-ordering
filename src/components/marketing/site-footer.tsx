import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { getContactLinks } from "@/lib/contact";

export function SiteFooter() {
  const contact = getContactLinks();
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Product</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/demo">Live demo</Link></li>
            <li><Link className="hover:text-foreground" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-foreground" href="/#faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Account</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/signup">Create account</Link></li>
            <li><Link className="hover:text-foreground" href="/login">Log in</Link></li>
            {contact.whatsapp && (
              <li>
                <a className="hover:text-foreground" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                  Contact on WhatsApp
                </a>
              </li>
            )}
            {contact.email && (
              <li><a className="hover:text-foreground" href={contact.email}>Email us</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}. Demo restaurant content is fictional.
        </p>
      </div>
    </footer>
  );
}
