import { lusitana } from '@/app/ui/fonts';

const LandingPageHeader = () => {
  return (
    <section className="panel px-6 py-8 sm:px-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.7fr)] lg:items-end">
        <div>
          <div className="page-eyebrow">Finance Operations Hub</div>
          <div className={`${lusitana.className} page-title mt-4 text-4xl font-semibold text-foreground sm:text-5xl`}>
            RKAC Finance
          </div>
          <div className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            A single workspace for donation entry, member administration, receipt generation,
            and day-to-day finance operations.
          </div>
        </div>

        <div className="panel-muted p-5">
          <div className="text-sm font-semibold text-foreground">Current focus</div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            Keep the navigation and working pages clean, predictable, and easy to scan.
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingPageHeader;
