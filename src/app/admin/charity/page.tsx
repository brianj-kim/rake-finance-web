import { getCharityProfile } from '@/app/lib/admin-actions';
import { requireSuperAdmin } from '@/app/lib/auth';
import CharityProfileForm from '@/app/ui/admin/charity-profile-form';
import PageIntro from '@/app/ui/page-intro';

const CharityAdminPage = async () => {
  await requireSuperAdmin({ nextPath: '/admin/charity' });

  const profile = await getCharityProfile();

  return (
    <main className="space-y-6">
      <PageIntro        
        title="Charity Profile"
        description="These values feed directly into generated donation receipts, so keep them accurate and current."
      />

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
