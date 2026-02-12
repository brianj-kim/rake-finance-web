const NUMBER_FORMATTER = new Intl.NumberFormat("en-CA");

export const formatNumber = (number: number) => {
    return NUMBER_FORMATTER.format(number);
}

export const formatCurrency = (cents: number) => {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1,2, 3, '...', totalPages -1, totalPages];
  }

  if (currentPage >= totalPages -2) {
    return [1,2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

export const truncate = (s: string | null | undefined, max: number) => {
  const v = (s ?? '').trim();
  if (!v) return null;
  return v.length <= max ? v : v.slice(0, max);
};

export const formatEnglishName = (first: string | null, last: string | null) => {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  const full = [f, l].filter(Boolean).join(' ');
  return full || null;
};

export const toInt = (v?: string) => {
  const n = Number.parseInt(v ?? '', 10);

  return Number.isFinite(n) ? n : undefined;
}
