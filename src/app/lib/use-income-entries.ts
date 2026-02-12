'use client';

import { useEffect, useMemo, useState } from 'react';
import { IncomeFormValues, IncomeEntryDTO } from '@/app/lib/definitions';


const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  } 
};

const normalizeName = (raw: string) => {
  return raw.trim().replace(/\s/g, "");
}

export const useIncomeEntries = (storageKey = "incomeEntries") => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [entries, setEntries] = useState<IncomeEntryDTO[]>([]);

  useEffect(() => {
    const stored = safeJsonParse<IncomeEntryDTO[]>(
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null,
      []
    );

    setEntries(stored);

    if (stored.length > 0 && stored[0].year && stored[0].month && stored[0].day) {
      setDate(new Date(`${stored[0].year}-${stored[0].month}-${stored[0].day}T00:00:00`))
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    }
  }, [entries, storageKey]);

  const totalCents = useMemo(
    () => entries.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [entries]
  );

  const getNextId = () => {
    const ids = entries.map((e) => e.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  };

  const requireDate = () => {
    if (!date) throw new Error("Date is required");
    return date;
  };

  const addEntry = (data: IncomeFormValues) => {
    const d = requireDate();
    const entry: IncomeEntryDTO = {
      id: getNextId(),
      name: normalizeName(data.name),
      amount: data.amount,
      type: Number(data.type),
      method: Number(data.method),
      notes: data.notes,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
    setEntries((prev) => [entry, ...prev]);
  };

  const updateEntry = (id: number, data: IncomeFormValues) => {
    const d = requireDate();
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              name: normalizeName(data.name),
              amount: data.amount,
              type: Number(data.type),
              method: Number(data.method),
              notes: data.notes,
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
            }
          : e
      )
    );
  };

  const removeEntry = (id: number) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const clearAll = () => {
    setEntries([]);
    setDate(undefined);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, "[]");
  };

  return { date, setDate, entries, totalCents, addEntry, updateEntry, removeEntry, clearAll };
}