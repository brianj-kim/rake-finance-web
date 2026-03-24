import Link from "next/link";
import {
  BuildingOffice2Icon,
  QueueListIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";

import { getCharityProfile, listCategories } from "@/app/lib/admin-actions";
import { requireSuperAdmin } from "@/app/lib/auth";
import PageIntro from "@/app/ui/page-intro";

const formatValue = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : "Not set yet";
};

const formatAddress = (profile: Awaited<ReturnType<typeof getCharityProfile>>) => {
  const parts = [
    profile.address,
    profile.city,
    profile.province,
    profile.postal,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "Not set yet";
};

const AdminPage = async () => {
  await requireSuperAdmin({ nextPath: "/admin" });

  const [charityProfile, categories] = await Promise.all([
    getCharityProfile(),
    listCategories(),
  ]);

  const typeCategories = categories.filter((category) => category.range === "inc");
  const methodCategories = categories.filter((category) => category.range === "imd");

  return (
    <main className="space-y-8">
      <PageIntro
        title="Admin Dashboard"
        description="Quick access to the charity profile and the category structures used across income entry."
      />

      <section className="border-y border-slate-200 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BuildingOffice2Icon className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Charity Profile</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-500">
              Receipt details currently saved for the organization.
            </p>
          </div>

          <Link
            href="/admin/charity"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-900"
          >
            Open charity profile
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1 border-t border-slate-200 pt-4">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Legal Name
            </dt>
            <dd className="text-sm text-slate-900">{formatValue(charityProfile.legalName)}</dd>
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-4">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Registration No.
            </dt>
            <dd className="text-sm text-slate-900">
              {formatValue(charityProfile.registrationNo)}
            </dd>
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-4">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Address
            </dt>
            <dd className="text-sm text-slate-900">{formatAddress(charityProfile)}</dd>
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-4">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Authorized Signer
            </dt>
            <dd className="text-sm text-slate-900">
              {formatValue(charityProfile.authorizedSigner)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <QueueListIcon className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Category Items</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-500">
              Type and Method values that appear across the income workflow.
            </p>
          </div>

          <Link
            href="/admin/category"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-900"
          >
            Open category admin
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-sm font-semibold text-slate-900">Type</div>
              <div className="mt-1 text-sm text-slate-500">
                {typeCategories.length} configured item{typeCategories.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {typeCategories.length ? (
                typeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">{category.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {formatValue(category.detail)}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {category.order ?? "-"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-slate-500">No Type categories yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-sm font-semibold text-slate-900">Method</div>
              <div className="mt-1 text-sm text-slate-500">
                {methodCategories.length} configured item{methodCategories.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {methodCategories.length ? (
                methodCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">{category.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {formatValue(category.detail)}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      {category.order ?? "-"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-slate-500">No Method categories yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminPage;
