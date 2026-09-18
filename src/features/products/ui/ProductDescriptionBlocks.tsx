import { Fragment } from "react";

import { sanitizeProductShortHtml } from "@/lib/sanitize/html";

type ProductShortTextProps = {
  html: string;
};

export function ProductShortText({ html }: ProductShortTextProps) {
  const safe = sanitizeProductShortHtml(html);
  if (!safe.trim()) return null;

  return (
    <div
      className="text-sm text-gray-600 [&_a]:text-marco-ink [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

type SpecRow = {
  title: string;
  value: string;
};

type ProductSpecificationsTableProps = {
  title: string;
  rows: readonly SpecRow[];
};

export function ProductSpecificationsTable({
  title,
  rows,
}: ProductSpecificationsTableProps) {
  const visible = rows.filter((row) => row.title || row.value);
  if (visible.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-6 md:pt-10" aria-label={title}>
      <h2 className="text-2xl font-bold tracking-tight text-marco-slate uppercase md:text-3xl">
        {title}
      </h2>
      <dl className="mt-6 grid grid-cols-1 gap-x-8 overflow-hidden rounded-2xl border border-gray-200/90 bg-white px-4 shadow-sm ring-1 ring-black/[0.02] sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-center sm:px-5">
        {visible.map((row, index) => (
          <Fragment key={`${row.title}-${index}`}>
            <dt
              className={`py-2 text-sm font-bold tracking-tight text-marco-ink sm:whitespace-nowrap md:text-base${
                index > 0 ? " border-t border-gray-100" : ""
              }`}
            >
              {row.title}
            </dt>
            <dd
              className={`min-w-0 pb-2 text-sm font-normal text-gray-700 sm:py-2 md:text-base${
                index > 0 ? " sm:border-t sm:border-gray-100" : ""
              }`}
            >
              {row.value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
