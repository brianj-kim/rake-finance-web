'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateAnnualReceipt } from './receipt-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const currentYear = new Date().getFullYear() - 1;

const GenerateReceiptForm = ({ memberId }: { memberId: number }) => {
  const router = useRouter();
  const [taxYear, setTaxYear] = React.useState(String(currentYear));
  const [loading, setLoading] = React.useState(false);

  const onGenerate = async () => {
    const y = Number(taxYear);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      toast.error('Invalid tax year.');
      return;
    }

    setLoading(true);

    try {
      const res = await generateAnnualReceipt({ memberId, taxYear: y});

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(`Receipt generated (#${res.serialNumber})`);
      router.refresh();
      window.open(res.pdfUrl, '_blank', 'noopener, noreferrer');
    } catch (err) {
      console.error('generateAnnualReceipt failed.', err);
      toast.error('Failed to generate receipt.');
    } finally {
      setLoading(false);
    } 
  };

  return (
    <div className='flex items-end gap-2'>
      <div className='space-y-1'>
        <div className='text-sm font-medium'>Tax year</div>
        <Input value={taxYear} onChange={(e) => setTaxYear(e.target.value)} className='w-[120px]' />        
      </div>

      <Button onClick={onGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate receipt'}
      </Button>
    </div>
  );
}

export default GenerateReceiptForm;