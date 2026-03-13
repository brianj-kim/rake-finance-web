'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveCharityProfile } from '@/app/lib/admin-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CharityProfileFormValues = {
  legalName: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  registrationNo: string;
  locationIssued: string;
  authorizedSigner: string;
  charityEmail: string;
  charityPhone: string;
  charityWebsite: string;
  churchLogoUrl: string;
  authorizedSignature: string;
};

type Props = {
  initialValues: CharityProfileFormValues;
};

const fieldLabel: Record<keyof CharityProfileFormValues, string> = {
  legalName: 'Legal Name',
  address: 'Address',
  city: 'City',
  province: 'Province',
  postal: 'Postal',
  registrationNo: 'Registration Number',
  locationIssued: 'Location Issued',
  authorizedSigner: 'Authorized Signer',
  charityEmail: 'Charity Email',
  charityPhone: 'Charity Phone',
  charityWebsite: 'Charity Website',
  churchLogoUrl: 'Church Logo URL',
  authorizedSignature: 'Authorized Signature URL',
};

const CharityProfileForm = ({ initialValues }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [values, setValues] = React.useState<CharityProfileFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const onChange =
    (field: keyof CharityProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  const clearField = (field: keyof CharityProfileFormValues) => () => {
    setValues((prev) => ({ ...prev, [field]: '' }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const formData = new FormData();
      formData.set('legalName', values.legalName);
      formData.set('address', values.address);
      formData.set('city', values.city);
      formData.set('province', values.province);
      formData.set('postal', values.postal);
      formData.set('registrationNo', values.registrationNo);
      formData.set('locationIssued', values.locationIssued);
      formData.set('authorizedSigner', values.authorizedSigner);
      formData.set('charityEmail', values.charityEmail);
      formData.set('charityPhone', values.charityPhone);
      formData.set('charityWebsite', values.charityWebsite);
      formData.set('churchLogoUrl', values.churchLogoUrl);
      formData.set('authorizedSignature', values.authorizedSignature);

      const result = await saveCharityProfile(formData);
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }

      toast.success('Charity profile saved.');
      router.refresh();
    });
  };

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardContent className='grid grid-cols-1 gap-4 pt-6 md:grid-cols-2'>
          <div className='space-y-2 md:col-span-2'>
            <label className='text-sm font-medium' htmlFor='legalName'>
              {fieldLabel.legalName}
            </label>
            <Input
              id='legalName'
              name='legalName'
              value={values.legalName}
              onChange={onChange('legalName')}
              aria-invalid={Boolean(fieldErrors.legalName)}
            />
            {fieldErrors.legalName ? (
              <p className='text-sm text-red-600'>{fieldErrors.legalName}</p>
            ) : null}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <label className='text-sm font-medium' htmlFor='address'>
              {fieldLabel.address}
            </label>
            <Input
              id='address'
              name='address'
              value={values.address}
              onChange={onChange('address')}
              aria-invalid={Boolean(fieldErrors.address)}
            />
            {fieldErrors.address ? (
              <p className='text-sm text-red-600'>{fieldErrors.address}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='city'>
              {fieldLabel.city}
            </label>
            <Input
              id='city'
              name='city'
              value={values.city}
              onChange={onChange('city')}
              aria-invalid={Boolean(fieldErrors.city)}
            />
            {fieldErrors.city ? <p className='text-sm text-red-600'>{fieldErrors.city}</p> : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='province'>
              {fieldLabel.province}
            </label>
            <Input
              id='province'
              name='province'
              value={values.province}
              onChange={onChange('province')}
              aria-invalid={Boolean(fieldErrors.province)}
            />
            {fieldErrors.province ? (
              <p className='text-sm text-red-600'>{fieldErrors.province}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='postal'>
              {fieldLabel.postal}
            </label>
            <Input
              id='postal'
              name='postal'
              value={values.postal}
              onChange={onChange('postal')}
              aria-invalid={Boolean(fieldErrors.postal)}
            />
            {fieldErrors.postal ? <p className='text-sm text-red-600'>{fieldErrors.postal}</p> : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='registrationNo'>
              {fieldLabel.registrationNo}
            </label>
            <Input
              id='registrationNo'
              name='registrationNo'
              value={values.registrationNo}
              onChange={onChange('registrationNo')}
              aria-invalid={Boolean(fieldErrors.registrationNo)}
            />
            {fieldErrors.registrationNo ? (
              <p className='text-sm text-red-600'>{fieldErrors.registrationNo}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='locationIssued'>
              {fieldLabel.locationIssued}
            </label>
            <Input
              id='locationIssued'
              name='locationIssued'
              value={values.locationIssued}
              onChange={onChange('locationIssued')}
              aria-invalid={Boolean(fieldErrors.locationIssued)}
            />
            {fieldErrors.locationIssued ? (
              <p className='text-sm text-red-600'>{fieldErrors.locationIssued}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='authorizedSigner'>
              {fieldLabel.authorizedSigner}
            </label>
            <Input
              id='authorizedSigner'
              name='authorizedSigner'
              value={values.authorizedSigner}
              onChange={onChange('authorizedSigner')}
              aria-invalid={Boolean(fieldErrors.authorizedSigner)}
            />
            {fieldErrors.authorizedSigner ? (
              <p className='text-sm text-red-600'>{fieldErrors.authorizedSigner}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='charityEmail'>
              {fieldLabel.charityEmail}
            </label>
            <Input
              id='charityEmail'
              name='charityEmail'
              value={values.charityEmail}
              onChange={onChange('charityEmail')}
              placeholder='Optional'
              aria-invalid={Boolean(fieldErrors.charityEmail)}
            />
            {fieldErrors.charityEmail ? (
              <p className='text-sm text-red-600'>{fieldErrors.charityEmail}</p>
            ) : null}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium' htmlFor='charityPhone'>
              {fieldLabel.charityPhone}
            </label>
            <Input
              id='charityPhone'
              name='charityPhone'
              value={values.charityPhone}
              onChange={onChange('charityPhone')}
              placeholder='Optional'
              aria-invalid={Boolean(fieldErrors.charityPhone)}
            />
            {fieldErrors.charityPhone ? (
              <p className='text-sm text-red-600'>{fieldErrors.charityPhone}</p>
            ) : null}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <label className='text-sm font-medium' htmlFor='charityWebsite'>
              {fieldLabel.charityWebsite}
            </label>
            <Input
              id='charityWebsite'
              name='charityWebsite'
              value={values.charityWebsite}
              onChange={onChange('charityWebsite')}
              placeholder='https://...'
              aria-invalid={Boolean(fieldErrors.charityWebsite)}
            />
            {fieldErrors.charityWebsite ? (
              <p className='text-sm text-red-600'>{fieldErrors.charityWebsite}</p>
            ) : null}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <div className='flex items-center justify-between gap-2'>
              <label className='text-sm font-medium' htmlFor='churchLogoUrl'>
                {fieldLabel.churchLogoUrl}
              </label>
              <Button type='button' size='sm' variant='secondary' onClick={clearField('churchLogoUrl')}>
                Remove Logo
              </Button>
            </div>
            <Input
              id='churchLogoUrl'
              name='churchLogoUrl'
              value={values.churchLogoUrl}
              onChange={onChange('churchLogoUrl')}
              placeholder='https://... or /path/to/logo.png'
              aria-invalid={Boolean(fieldErrors.churchLogoUrl)}
            />
            {fieldErrors.churchLogoUrl ? (
              <p className='text-sm text-red-600'>{fieldErrors.churchLogoUrl}</p>
            ) : null}
            {values.churchLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.churchLogoUrl}
                alt='Church logo preview'
                className='max-h-24 max-w-full rounded-md border border-gray-200 bg-white p-2'
              />
            ) : (
              <p className='text-xs text-gray-500'>No logo set.</p>
            )}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <div className='flex items-center justify-between gap-2'>
              <label className='text-sm font-medium' htmlFor='authorizedSignature'>
                {fieldLabel.authorizedSignature}
              </label>
              <Button type='button' size='sm' variant='secondary' onClick={clearField('authorizedSignature')}>
                Remove Signature
              </Button>
            </div>
            <Input
              id='authorizedSignature'
              name='authorizedSignature'
              value={values.authorizedSignature}
              onChange={onChange('authorizedSignature')}
              placeholder='https://... or /path/to/signature.png'
              aria-invalid={Boolean(fieldErrors.authorizedSignature)}
            />
            {fieldErrors.authorizedSignature ? (
              <p className='text-sm text-red-600'>{fieldErrors.authorizedSignature}</p>
            ) : null}
            {values.authorizedSignature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.authorizedSignature}
                alt='Authorized signature preview'
                className='max-h-24 max-w-full rounded-md border border-gray-200 bg-white p-2'
              />
            ) : (
              <p className='text-xs text-gray-500'>No signature image set.</p>
            )}
          </div>
        </CardContent>

        <CardFooter className='justify-end gap-2 border-t'>
          <Button type='submit' disabled={pending}>
            {pending ? 'Saving...' : 'Save Charity Profile'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CharityProfileForm;
