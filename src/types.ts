/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LoanInput {
  amount: number;
  annualInterestRate: number;
  termMonths: number;
  startDate: string;
  openingFeeType: 'percent' | 'fixed';
  openingFeeValue: number;
  isOpeningFeeFinanced: boolean;
  insuranceSinglePremium: number;
  isInsuranceFinanced: boolean;
  recurringMonthlyCosts: number;
  userProvidedApr?: number;
  loanType?: string;
}

export type ExtraPaymentType = 'partial' | 'total';

export interface ExtraPayment {
  month: number;
  amount: number;
  type: ExtraPaymentType;
}

export interface AmortizationRow {
  monthStep: number;
  paymentDate: Date;
  monthlyLoanPayment: number;
  recurringCosts: number;
  totalPayment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
  accumulatedInterest: number;
  extraPayment?: number;
}

export interface LoanSummary {
  totalPaid: number;
  totalInterest: number;
  monthlyPayment: number;
  payoffDate: Date;
  savings?: {
    interestSaved: number;
    monthsSaved: number;
  };
}
