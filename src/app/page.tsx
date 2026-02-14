import { isSignedIn } from "@/app/lib/auth";
import SignOutButton from "@/app/ui/auth/sign-out-button";
import Link from "next/link";
import {
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

const tiles: Tile[] = [
  {
    title: "Income",
    description: "Track donations, run batch entry, and review dashboards & exports.",
    href: "/income",
    icon: BanknotesIcon,
  },
  {
    title: "Members & Households",
    description:
      "Member admin now. Later: households, dependents → adult members, yearly cell groups.",
    href: "/income/member",
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
    description: "Manage Charity / Church info, categories used throughout the app.",
    href: "/admin/categories",
    disabled: true,
    badge: "Planned",
    icon: TagIcon,
  },
];

const TileCard = ({ t }: { t: Tile }) => {
  const CardInner = (
    <div
      className={[
        "h-full rounded-lg border border-gray-200 bg-white shadow-sm transition-colors",
        t.disabled ? "opacity-60" : "hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 border-b bg-gray-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <t.icon className="h-5 w-5 text-gray-700" />
            <div className="font-semibold truncate">{t.title}</div>
            {t.badge ? (
            <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {t.badge}
            </div>
          ) : null}
          </div>
          
        </div>
      </div>

      <div className="px-4 py-3 text-sm text-muted-foreground">
        {t.description}
      </div>

      <div className="px-4 pb-4">
        <div
          className={[
            "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium",
            t.disabled
              ? "bg-gray-100 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700",
          ].join(" ")}
        >
          {t.disabled ? "Not available" : "Open"}
        </div>
      </div>
    </div>
  );

  if (t.disabled || !t.href) return <div>{CardInner}</div>;

  return (
    <Link
      href={t.href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg"
    >
      {CardInner}
    </Link>
  );
};

const Page = async () => {
  const signedIn = await isSignedIn();
  return (
    <main className="min-h-screen p-6">
      <LandingPageHeader />

      {/* Modules */}
      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Modules</h2>
          <p className="text-sm text-muted-foreground">
            Choose where you want to work. Planned features are shown but disabled.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {tiles.map((t) => (
            <TileCard key={t.title} t={t} />
          ))}
        </div>

        <div className='grid grid-cols-1 mt-6'>
          {/* Logout button (only if signed in) */}
          {signedIn ? (
            <div className="shrink-0">
              <SignOutButton
                className='border m'
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Roadmap (lightweight) */}
      <div className="mt-6 rounded-lg border bg-gray-50 p-4">
        <div className="text-sm font-semibold">Next iterations (planned)</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Households → dependents → adult member promotion</li>
          <li>Year-based cell group changes</li>
          <li>Admin: manage categories (type/method/etc.)</li>
          <li>Admin: church/charity profile + authorized signer</li>
          <li>Expenditure module + reporting</li>
        </ul>
      </div>
    </main>
  );
};

export default Page;