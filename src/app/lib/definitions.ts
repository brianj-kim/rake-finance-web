import { z } from "zod";

export type IncomeDataItem = {
    type: number;
    method?: number;
    month: number | null;
    _sum: {
        amount: number | null
    };
} 

export type Category = {
    id: number;
    name: string
}

export type IncomeSummary = {
  total: number;
  byCategory: {
    categoryId: number;
    categoryName: string;
    sum: number;
    order?: number | null;
  }[];
};


export type CategoryDTO = {
  id: number;
  name: string;
  detail?: string | null;
  order?: number | null;
  range?: string | null;
}

export type IncomeEntryDTO = {
  id: number; // keep number to avoid changing your backend contract
  name: string;
  amount: number; // cents
  type: number;
  method: number;
  notes?: string;
  year?: number;
  month?: number;
  day?: number;
  qt?: number;
  mid?: number;
};

export type EditIncomeDTO = {
  inc_id: number;
  name: string;
  amount: number;
  inc_type: number;
  inc_method: number;
  notes: string;
  year: number;
  month: number;
  day: number;
};

export type BatchEntry = {
  name: string;
  amount: number;
  type: number;
  method: number;
  note: string;
}

export type BatchIncomeDTO = {
  year: number;
  month: number;
  day: number;
  entries: BatchEntry[];  
}

export const IncomeSchema = z.object({
  name: z.string().trim().min(2),
  amount: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().positive()
  ),
  type: z.string().min(1),
  method: z.string().min(1),
  notes: z.string().trim().optional(),
});

export type IncomeFormValues = z.infer<typeof IncomeSchema>;

export const EntrySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  amount: z.number().int().positive("Amount must be larger than 0"),
  typeId: z.number().int().positive("Select a type"),
  methodId: z.number().int().positive("Select a method"),
  note: z.string().trim().optional(),
});

export const BatchSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  entries: z.array(EntrySchema).min(1),
});

export type BatchFormInput = z.input<typeof BatchSchema>;
export type BatchFormValues = z.infer<typeof BatchSchema>;


export type SaveBatchIncomeResult = 
  | { success: true; incomeCount: number; createdMembers: number }
  | { success: false; message: string; meta?: unknown }


export type EditMemberDTO = {
  mbr_id: number;
  name_kFull: string;
  name_eFirst: string | null;
  name_eLast: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal: string | null;
  note: string | null;
};



// Receipt Definitions
export type ReceiptMemberSummary = {
  memberId: number;
  oName: string | null;
  kName: string;
  donationCount: number;
  totalCents: number;
  pdfUrl?: string | null;
};

export type DonationRow = {
  incId: number;
  dateISO: string; // YYYY-MM-DD
  amountCents: number;
  typeName?: string | null;
  methodName?: string | null;
  notes?: string | null;
};

export type ReceiptMemberInfo = {
  memberId: number;
  nameOfficial: string;
  name_kFull: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal: string | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
};

// Manage Receipt Data
export type ReceiptListRow = {
  id: string;
  taxYear: number;
  serialNumber: number;
  issueDateISO: string,
  memberId: number;
  donorName: string;
  totalCents: number;
  pdfUrl: string | null;
};

export type ReceiptListResult = {
  data: ReceiptListRow[];
  pagination: { totalPages: number; totalItems: number };
}

export type ActionOK<T extends object = {}> = { success: true } & T;
export type ActionFail = { success: false; message: string };
export type ActionResult<T extends object = {}> = ActionOK<T> | ActionFail;