import { canAccessAdmin, canAccessFinance, isSignedIn } from "@/app/lib/auth";
import SignOutButton from "@/app/ui/auth/sign-out-button";
import Link from "next/link";
import {
  ArrowRightIcon,
  BanknotesIcon,
  CreditCardIcon,
  UsersIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

import LandingPageHeader from "./ui/landing-header";



type Tile = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const TileCard = ({ t }: { t: Tile }) => {
  const CardInner = (
    <div
      className={[
        "panel-muted h-full overflow-hidden p-5",
        t.disabled ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
            <t.icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold text-foreground">{t.title}</div>
              {t.badge ? (
                <div className="inline-flex rounded-full border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {t.badge}
                </div>
              ) : null}
            </div>
            <div className="mt-3 text-sm leading-6 text-muted-foreground">{t.description}</div>
          </div>
        </div>
        <div className="rounded-full border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t.disabled ? "Planned" : "Ready"}
        </div>
      </div>

      <div className="mt-8">
        <div
          className={[
            "inline-flex items-center gap-2 text-sm font-semibold",
            t.disabled
              ? "text-muted-foreground"
              : "text-primary",
          ].join(" ")}
        >
          {t.disabled ? "Not available yet" : "Open workspace"}
          <ArrowRightIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );

  if (t.disabled || !t.href) return <div>{CardInner}</div>;

  return (
    <Link
      href={t.href}
      className="block rounded-[1.35rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {CardInner}
    </Link>
  );
};

const Page = async () => {
  const [signedIn, canOpenAdmin, canOpenFinance] = await Promise.all([
    isSignedIn(),
    canAccessAdmin(),
    canAccessFinance(),
  ]);
  const tiles: Tile[] = [
    {
      title: "Income",
      description: "Track donations, run batch entry, and review dashboards & exports.",
      href: "/income",
      disabled: !canOpenFinance,
      badge: canOpenFinance ? undefined : "Finance roles only",
      icon: BanknotesIcon,
    },
    {
      title: "Members & Households",
      description:
        "Member admin now. Later: households, dependents → adult members, yearly cell groups.",
      href: "/income/member",
      disabled: !canOpenFinance,
      badge: canOpenFinance ? undefined : "Finance roles only",
      icon: UsersIcon,
    },
    {
      title: "Expenditure",
      description: "Record expenses and manage outflow reporting. (Coming soon)",
      href: "/expenditure",
      disabled: true,
      badge: "Coming soon",
      icon: CreditCardIcon,
    },
    {
      title: "App Admin",
      description: "Super-only tools for charity profile, categories, and future configuration.",
      href: "/admin",
      disabled: !canOpenAdmin,
      badge: canOpenAdmin ? undefined : "Super only",
      icon: TagIcon,
    },
  ];

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <LandingPageHeader />

        <section className="panel p-6 sm:p-7">
          <div className="mb-5 flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">Modules</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose where you want to work. Planned features are shown but disabled.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {tiles.map((t) => (
              <TileCard key={t.title} t={t} />
            ))}
          </div>
        </section>

        {signedIn ? (
          <section className="panel-muted flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Signed in</div>
              <div className="mt-1 text-sm text-muted-foreground">
                End the current session before switching accounts or devices.
              </div>
            </div>
            <div className="sm:w-[200px]">
              <SignOutButton />
            </div>
          </section>
        ) : null}

        <section className="panel-muted p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Next Iterations
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Households, dependents, and adult-member promotion flows.</li>
            <li>Year-based cell group changes and longer-term member history.</li>
            <li>More admin controls for categories, charity profile, and signers.</li>
            <li>Expenditure module, reporting, and cross-module financial summaries.</li>
          </ul>
        </section>
      </div>
    </main>
  );
};

export default Page;
