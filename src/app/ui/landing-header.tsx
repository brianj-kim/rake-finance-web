import { lusitana } from '@/app/ui/fonts';

const LandingPageHeader = () => {

  return (

      <div className="rounded-lg bg-blue-600 px-6 py-6 text-white md:py-10">
        <div className={`${lusitana.className} text-2xl md:text-3xl`}>
          RKAC Finance
        </div>
        <div className="mt-2 max-w-3xl text-sm text-blue-50 md:text-base">
          Admin portal for income, donation receipts, members, and future modules like
          expenditure, households, and configuration tools.
        </div>
      </div>
  );
}

export default LandingPageHeader;