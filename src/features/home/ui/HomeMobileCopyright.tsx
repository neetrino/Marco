const NEETRINO_STUDIO_HREF = "https://neetrino.com/";

type HomeMobileCopyrightProps = {
  copyrightBefore: string;
  creditStudio: string;
};

/** Mobile-only home credit at the bottom of the page. */
export function HomeMobileCopyright({
  copyrightBefore,
  creditStudio,
}: HomeMobileCopyrightProps) {
  const year = new Date().getFullYear();

  return (
    <div className="px-4 pb-10 pt-8 text-center md:hidden">
      <p className="text-xs leading-snug text-marco-slate">
        {copyrightBefore.replace("{year}", String(year))}
      </p>
      <a
        href={NEETRINO_STUDIO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block whitespace-nowrap text-xs font-bold uppercase tracking-[0.12em] text-marco-yellow no-underline hover:opacity-80"
      >
        {creditStudio}
      </a>
    </div>
  );
}
