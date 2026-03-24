import { lusitana } from '@/app/ui/fonts';
import { cn } from '@/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

const PageIntro = ({ eyebrow, title, description, actions, className }: Props) => {
  return (
    <section className={cn('page-intro', className)}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
          <div>
            <h1 className={cn(lusitana.className, 'page-title text-lg font-semibold text-foreground sm:text-lg')}>
              {title}
            </h1>
            {description ? (
              <p className="text-small leading-6 text-muted-foreground sm:text-sm">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
};

export default PageIntro;
