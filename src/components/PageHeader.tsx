export default function PageHeader({
  title,
  accent,
  subtitle,
  badge,
}: {
  title: string;
  accent?: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
          {title} {accent && <span className="italic text-gold">{accent}</span>}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy/55">
            {subtitle}
          </p>
        )}
      </div>
      {badge}
    </header>
  );
}
