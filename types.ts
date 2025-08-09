// Shared UI/domain types (do not edit Supabase generated database/types.ts)

// Validation rule types for dynamic form fields
export interface NumberValidationRules {
  type: 'number'
  min?: number
  max?: number
  integerOnly?: boolean
}

export interface EmailValidationRules {
  type: 'email'
  // Example: ["gmail.com", "school.edu"]
  allowedDomains?: string[]
}

export interface DateValidationRules {
  type: 'date'
  // ISO date strings (YYYY-MM-DD) or full ISO timestamps
  minDate?: string
  maxDate?: string
  noPast?: boolean
  noFuture?: boolean
}

export type FormFieldValidationRules =
  | NumberValidationRules
  | EmailValidationRules
  | DateValidationRules


