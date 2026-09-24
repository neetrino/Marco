"use client";

import { useEffect, useRef, useState } from "react";

import { formatCatalogFilterPrice } from "@/features/products/domain/catalog-price-bounds";
import {
  CATALOG_PRICE_TITLE,
  CATALOG_PRICE_TRACK,
  CATALOG_PRICE_VALUE,
} from "@/features/products/ui/catalog-filter-classes";
import type { Currency } from "@/lib/money/currency";

const PRICE_DEBOUNCE_MS = 400;
const PRICE_STEP = 1000;

const RANGE_INPUT =
  "pointer-events-none absolute inset-0 h-2 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative " +
  "[&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#e2e8f0] " +
  "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 " +
  "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[#e2e8f0] " +
  "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm";

type CatalogPriceFilterProps = {
  title: string;
  minBound: number;
  maxBound: number;
  selectedMin: number;
  selectedMax: number;
  currency: Currency;
  minLabel: string;
  maxLabel: string;
  onChange: (min: number, max: number) => void;
};

export function CatalogPriceFilter({
  title,
  minBound,
  maxBound,
  selectedMin,
  selectedMax,
  currency,
  minLabel,
  maxLabel,
  onChange,
}: CatalogPriceFilterProps) {
  const [minValue, setMinValue] = useState(selectedMin);
  const [maxValue, setMaxValue] = useState(selectedMax);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (minValue === selectedMin && maxValue === selectedMax) return;
    const timer = window.setTimeout(() => {
      onChangeRef.current(minValue, maxValue);
    }, PRICE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [minValue, maxValue, selectedMin, selectedMax]);

  const span = Math.max(1, maxBound - minBound);
  const left = ((minValue - minBound) / span) * 100;
  const right = ((maxBound - maxValue) / span) * 100;
  const disabled = minBound === maxBound;

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1 flex min-h-6 w-full items-center justify-between gap-2">
        <h2 className={CATALOG_PRICE_TITLE}>{title}</h2>
        <p className={CATALOG_PRICE_VALUE}>
          {formatCatalogFilterPrice(minValue, currency)}
          {" - "}
          {formatCatalogFilterPrice(maxValue, currency)}
        </p>
      </div>
      <div className={`${CATALOG_PRICE_TRACK} ${disabled ? "opacity-60" : ""}`}>
        <div
          className="absolute top-0 h-full rounded-full bg-marco-yellow"
          style={{ left: `${left}%`, right: `${right}%` }}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={PRICE_STEP}
          value={minValue}
          disabled={disabled}
          aria-label={minLabel}
          className={RANGE_INPUT}
          onChange={(event) => {
            const next = Number(event.target.value);
            setMinValue(Math.min(next, maxValue));
          }}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={PRICE_STEP}
          value={maxValue}
          disabled={disabled}
          aria-label={maxLabel}
          className={RANGE_INPUT}
          onChange={(event) => {
            const next = Number(event.target.value);
            setMaxValue(Math.max(next, minValue));
          }}
        />
      </div>
    </div>
  );
}
