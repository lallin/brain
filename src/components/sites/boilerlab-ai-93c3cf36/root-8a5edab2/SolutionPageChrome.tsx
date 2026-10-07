"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SiteHeader";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

/** Shared header/footer chrome for the /solutions detail pages — the same
 * SiteHeader as the home page (logo, Solution mega-menu, About Us, Demo,
 * EN), plus a "back to the solutions list" link these pages need but the
 * home page doesn't. */
export function SolutionPageChrome({ children }: { children: React.ReactNode }) {
  const lang = useLang();
  return (
    <div className="solution-page">
      <SiteHeader backLink={{ href: "/#products", label: `← ${t(lang, "solution_detail.back_to_list")}` }} />
      <main className="solution-page-main">{children}</main>
      <footer className="solution-page-footer">
        <div>
          <span className="logo-text">BRAINDECK</span>
          <p>
            {t(lang, "footer.description_line1")} {t(lang, "footer.description_line2")}
          </p>
        </div>
        <div>
          <h4>{t(lang, "header_solutions")}</h4>
          <Link href="/solutions/category/voucher">{t(lang, "categories.voucher.title")}</Link>
          <Link href="/solutions/category/content">{t(lang, "header_solutions_content")}</Link>
          <Link href="/solutions/category/healthcare">{t(lang, "header_solutions_medical")}</Link>
          <Link href="/solutions/category/ax">{t(lang, "header_solutions_ax")}</Link>
        </div>
        <div>
          <h4>{t(lang, "footer.contact")}</h4>
          <a href="mailto:braindeck@braindeck.net">braindeck@braindeck.net</a>
          <p>+82-2-2088-7522</p>
          <p>{t(lang, "footer.address_line1")}</p>
          <p>{t(lang, "footer.address_line2")}</p>
        </div>
      </footer>
    </div>
  );
}
