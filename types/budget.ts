export type CategoryType = "expense" | "income" | "investment";
export type RepeatMode = "split" | "replicate";

export interface Category {
  id?: string;
  groupId?: string;
  name: string;
  value: number;
  categoryType: CategoryType;
  icon: string;
  color: string;
  totalMonths?: number;
  repeatMode?: RepeatMode;
  installmentLabel?: string | null;
  installments?: string;
}

export interface MonthlyBudget {
  categories: Category[];
}
