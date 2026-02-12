import { fetchCardData } from "@/app/lib/data";
import { formatCurrency } from "@/app/lib/utils";
import { lusitana } from "../fonts";

type CardWrapperProps = {
    selectedYear: number;
}

const CardWrapper = async ({ selectedYear }: CardWrapperProps) => {
    const { total, byCategory } = await fetchCardData(selectedYear)

    return (
        <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <Card title='Total Income' value={total} variant='total' />

          {byCategory.map((item) => (
            <Card
                key={item.categoryId}
                title={item.categoryName}
                value={item.sum}
                variant='default'
            />
          ))}
        </section>        
    );
}

export const Card = ({
    title,
    value,
    variant = 'default',
}: {
    title: string;
    value: number | null; // cents
    variant?: 'default' | 'total'; 
}) => {
    const containerClass =
        variant === 'total'
            ? 'bg-gray-100 ring-1 ring-gray-200'
            : 'bg-gray-50 hover:bg-gray-100'

    return (
			<div className={`rounded-xl p-3 shadow-sm transition-colors ${containerClass}`}>
				<div className='flex items-start justify-between gap-3 p-3'>
					<h3 className='text-sm font-medium text-gray-700'>{title}</h3>
				</div>

				<div className='px-3 pb-3'>
					<p
						className={`${lusitana.className} truncate rounded-xl bg-white px-4 py-6 text-center text-2xl font-semibold text-gray-900`}
					>
						{formatCurrency((value ?? 0))}
					</p>
				</div>
			</div>
    )
}


export default CardWrapper;