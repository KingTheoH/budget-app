// Types
export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  category: string
  note: string
  isRecurring: boolean
}

export interface Budget {
  category: string
  monthlyLimit: number
}

export interface RecurringTransaction {
  id: string
  name: string
  amount: number
  type: TransactionType
  category: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextDate: string
}

export interface Investment {
  id: string
  name: string
  ticker: string
  shares: number
  buyPrice: number
  currentPrice: number
}

// Default categories
export const EXPENSE_CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Health', 'Entertainment',
  'Shopping', 'Utilities', 'Education', 'Travel', 'Other'
]
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

// Storage helpers
function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function set(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// Transactions
export const getTransactions = (): Transaction[] => get('transactions', [])
export const saveTransactions = (t: Transaction[]) => set('transactions', t)

export const addTransaction = (t: Omit<Transaction, 'id'>): Transaction => {
  const tx: Transaction = { ...t, id: crypto.randomUUID() }
  saveTransactions([...getTransactions(), tx])
  return tx
}

export const deleteTransaction = (id: string) => {
  saveTransactions(getTransactions().filter(t => t.id !== id))
}

// Budgets
export const getBudgets = (): Budget[] => get('budgets', [])
export const saveBudgets = (b: Budget[]) => set('budgets', b)

export const upsertBudget = (budget: Budget) => {
  const budgets = getBudgets()
  const idx = budgets.findIndex(b => b.category === budget.category)
  if (idx >= 0) budgets[idx] = budget
  else budgets.push(budget)
  saveBudgets(budgets)
}

export const deleteBudget = (category: string) => {
  saveBudgets(getBudgets().filter(b => b.category !== category))
}

// Recurring
export const getRecurring = (): RecurringTransaction[] => get('recurring', [])
export const saveRecurring = (r: RecurringTransaction[]) => set('recurring', r)

export const addRecurring = (r: Omit<RecurringTransaction, 'id'>): RecurringTransaction => {
  const rec: RecurringTransaction = { ...r, id: crypto.randomUUID() }
  saveRecurring([...getRecurring(), rec])
  return rec
}

export const deleteRecurring = (id: string) => {
  saveRecurring(getRecurring().filter(r => r.id !== id))
}

// Investments
export const getInvestments = (): Investment[] => get('investments', [])
export const saveInvestments = (inv: Investment[]) => set('investments', inv)

export const addInvestment = (inv: Omit<Investment, 'id'>): Investment => {
  const item: Investment = { ...inv, id: crypto.randomUUID() }
  saveInvestments([...getInvestments(), item])
  return item
}

export const updateInvestment = (id: string, updates: Partial<Investment>) => {
  saveInvestments(getInvestments().map(i => i.id === id ? { ...i, ...updates } : i))
}

export const deleteInvestment = (id: string) => {
  saveInvestments(getInvestments().filter(i => i.id !== id))
}

// Helpers
export const getCurrentMonthTransactions = (): Transaction[] => {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  return getTransactions().filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
