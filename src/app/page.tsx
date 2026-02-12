// /app/page.tsx
import Link from "next/link";
import { lusitana } from "./ui/fonts";
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Page = () => {
  return (
    <main className="min-h-screen">
      {/* Top header band */}
      <div className="bg-blue-600">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="text-white">
              <div className={`${lusitana.className} text-2xl md:text-4xl`}>
                RKAC Finance
              </div>
              <p className="mt-2 max-w-2xl text-sm/6 text-white/90 md:text-base/7">
                Admin portal for tracking income, generating donation receipts, and
                managing members.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/income"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-white/90"
              >
                Go to Income
              </Link>

              <Link
                href="/expenditure"
                className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Expenditure (Coming soon)
              </Link>
            </div>
          </div>

          {/* quick highlights */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/10 p-4 text-white">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5" />
                <div className="text-sm font-medium">Income dashboard</div>
              </div>
              <div className="mt-1 text-xs text-white/80">
                KPI + monthly/quarterly views
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 text-white">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                <div className="text-sm font-medium">Donation receipts</div>
              </div>
              <div className="mt-1 text-xs text-white/80">
                Generate + manage PDFs
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 text-white">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5" />
                <div className="text-sm font-medium">Batch entry</div>
              </div>
              <div className="mt-1 text-xs text-white/80">
                Fast Sunday offering input
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                <div className="text-sm font-medium">Admin only</div>
              </div>
              <div className="mt-1 text-xs text-white/80">
                JWT session-protected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main cards */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-6">
              <div className={`${lusitana.className} text-xl md:text-2xl`}>
                Choose a module
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Start with Income. Expenditure will follow the same layout and
                permissions once implemented.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/income"
                  className="group rounded-lg border bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">Income</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Dashboard, list, batch create, members, receipts
                      </div>
                    </div>
                    <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/expenditure"
                  className="rounded-lg border bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">Expenditure</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Coming soon (route placeholder)
                      </div>
                    </div>
                    <BanknotesIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="rounded-lg border bg-white p-6">
            <div className="text-sm font-semibold">Quick links</div>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/income"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 text-center"
              >
                Open Income
              </Link>
              <Link
                href="/income/receipt"
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 text-center"
              >
                Donation receipts
              </Link>
              <Link
                href="/income/member"
                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 text-center"
              >
                Member admin
              </Link>
            </div>

            <div className="mt-6 rounded-md bg-gray-50 p-4">
              <div className="text-sm font-medium">Tip</div>
              <p className="mt-1 text-sm text-muted-foreground">
                If you want root <code className="px-1">/</code> to require login,
                keep your auth proxy/middleware protecting it and redirect to{" "}
                <code className="px-1">/login</code> when unauthenticated.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          RKAC Finance • Internal admin tool
        </div>
      </div>
    </main>
  );
};

export default Page;


// import { lusitana } from "./ui/fonts";

// const Page = () => {
//   return (
//     <main className="flex min-h-screen flex-col p-6">
//       <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        
//       </div>
//       <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
//         <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
//           <p className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}>
//             <strong>Welcome to Acme.</strong> This is the example for the{' '}
//             <a href="https://nextjs.org/learn/" className="text-blue-500">
//               Next.js Learn Course
//             </a>
//             , brought to you by Vercel.
//           </p>
          
//             <span>Log in</span> 
//         </div>
//         <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
//           {/* Add Hero Images Here */}
         
//         </div>
//       </div>
//     </main>
//   )
// }

// export default Page;