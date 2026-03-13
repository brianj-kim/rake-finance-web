import { getCharityProfile } from '@/app/lib/admin-actions';
import { requireSuperAdmin } from '@/app/lib/auth';
import CharityProfileForm from '@/app/ui/admin/charity-profile-form';
import { lusitana } from '@/app/ui/fonts';

const CharityAdminPage = async () => {
  await requireSuperAdmin({ nextPath: '/admin/charity' });

  const profile = await getCharityProfile();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Charity Profile</h1>
      <p className='mb-6 text-sm text-gray-600'>
        Super admin only. These values are copied into generated donation receipts.
      </p>

      <CharityProfileForm
        initialValues={{
          legalName: profile.legalName ?? '',
          address: profile.address ?? '',
          city: profile.city ?? '',
          province: profile.province ?? '',
          postal: profile.postal ?? '',
          registrationNo: profile.registrationNo ?? '',
          locationIssued: profile.locationIssued ?? '',
          authorizedSigner: profile.authorizedSigner ?? '',
          charityEmail: profile.charityEmail ?? '',
          charityPhone: profile.charityPhone ?? '',
          charityWebsite: profile.charityWebsite ?? '',
          churchLogoUrl: profile.churchLogoUrl ?? '',
          authorizedSignature: profile.authorizedSignature ?? '',
        }}
      />
    </main>
  );
};

export default CharityAdminPage;
