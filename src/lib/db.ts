export interface Debt {
  id?: number;
  // cloudId removed as id is now the cloud id
  userId: string;
  name: string;
  type: 'credit_card' | 'personal_loan' | 'paylater' | 'car_loan' | 'motorcycle_loan' | 'bank_loan' | 'other';
  balance: number;
  interestRate: number; // Annual rate in %
  minPaymentType: 'percent' | 'fixed';
  minPaymentValue: number; // % value or fixed amount
  dueDay: number; // 1-31
  status: 'active' | 'closed';
  targetPayment?: number; // Optional user target
  fixedPayment?: number; // For fixed installment loans
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Advanced Interest
  promoRate?: number;
  promoEndDate?: Date;
}

export interface Budget {
  id?: number;
  userId: string;
  salary: number;
  tax: number;
  sso: number; // Social Security
  pvd: number; // Provident Fund
  otherIncome: number;
  bonus: {
    month: number;
    year?: number; // For one-time
    amount: number;
    frequency: 'one-time' | 'monthly' | 'yearly';
  }[]; // Array of bonuses
  expenses: {
    rent: number;
    food: number;
    transport: number;
    others: number;
    custom: { name: string; amount: number }[];
  };
  monthlySavingsTarget: number;
}

export interface PaymentPlan {
  id?: number;
  userId: string;
  strategy: 'snowball' | 'avalanche'; // default snowball
  allocationType?: 'full' | 'percent' | 'fixed'; // new field
  allocationValue?: number; // new field (percent 0-100 or fixed amount)
  extraIncomeAllocationType?: 'full' | 'percent' | 'fixed'; // valid values: full, percent, fixed
  extraIncomeAllocationValue?: number; // value for extra income allocation
  customOrder: number[]; // Array of debt IDs
  bonusMonths: { month: number; isBonus: boolean }[]; // Specific flags for scenario
  minPaymentBuffer: number; // Extra buffer % for min payment (e.g. 5%)
}

export interface Transaction {
  id?: number;
  userId: string;
  debtId: number;
  amount: number;
  date: Date;
  type: 'payment' | 'interest' | 'fee' | 'adjustment';
  note?: string;
  attachmentUrl?: string; // Path/URL to slip image
}

// NOTE: Dexie AppDatabase class removed for Cloud-Only Architecture
// export const db = new AppDatabase();
