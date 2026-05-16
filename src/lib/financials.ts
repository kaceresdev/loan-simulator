/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addMonths } from 'date-fns';
import { AmortizationRow, ExtraPayment, LoanInput } from '../types';

/**
 * Calculates a standard French amortization schedule with support for extra payments.
 */
export function calculateAmortizationSchedule(
  input: LoanInput,
  extraPayments: ExtraPayment[] = [],
  additionalMonthlyFee: number = 0
): AmortizationRow[] {
  const { amount, annualInterestRate, termMonths, startDate } = input;
  
  if (!amount || amount <= 0 || !termMonths || termMonths <= 0) {
    return [];
  }

  const monthlyRate = (annualInterestRate || 0) / 100 / 12;
  const schedule: AmortizationRow[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  
  let currentBalance = amount;
  let accumulatedInterest = 0;

  // Standard monthly payment calculation (PMT)
  const standardMonthlyPayment = monthlyRate > 0 
    ? Math.round(((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))) * 100) / 100
    : Math.round((amount / termMonths) * 100) / 100;

  if (isNaN(standardMonthlyPayment) || !isFinite(standardMonthlyPayment)) {
    return [];
  }

  for (let m = 1; m <= 600; m++) { // Max 50 years to avoid infinite loops
    if (currentBalance <= 0) break;

    const interest = currentBalance * monthlyRate;
    let principal = Math.min(standardMonthlyPayment - interest, currentBalance);
    
    // Check for extra payments this month
    const extras = extraPayments.filter(ep => ep.month === m);
    let extraAmount = 0;
    let isTotalPayment = false;

    for (const ep of extras) {
      if (ep.type === 'total') {
        extraAmount = currentBalance - principal;
        isTotalPayment = true;
        break;
      } else {
        extraAmount += Math.min(ep.amount, currentBalance - principal);
      }
    }

    const totalPrincipalForMonth = principal + extraAmount;
    currentBalance -= totalPrincipalForMonth;
    accumulatedInterest += interest;

    const monthlyLoanPayment = principal + interest;
    const recurringCosts = (input.recurringMonthlyCosts || 0) + additionalMonthlyFee;

    schedule.push({
      monthStep: m,
      paymentDate: addMonths(start, m),
      monthlyLoanPayment,
      recurringCosts,
      totalPayment: monthlyLoanPayment + recurringCosts,
      interest,
      principal,
      remainingBalance: Math.max(0, currentBalance),
      accumulatedInterest,
      extraPayment: extraAmount > 0 ? extraAmount : undefined,
    });

    if (isTotalPayment || currentBalance <= 0.01) {
      currentBalance = 0;
      break;
    }
  }

  return schedule;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/**
 * Calculates APR (TAE) using Newton-Raphson to find the internal rate of return.
 */
export function calculateAPR(
  amount: number,
  monthlyPayment: number,
  termMonths: number,
  openingFeeValue: number
): number {
  if (!amount || !termMonths || !monthlyPayment) return 0;
  const netAmount = amount - openingFeeValue;
  if (netAmount <= 0) return 0;
  
  // Solve for i: netAmount = monthlyPayment * [(1 - (1+i)^-N) / i]
  // f(i) = monthlyPayment * (1 - (1+i)^-N) - i * netAmount
  // f'(i) = monthlyPayment * N * (1+i)^-(N+1) - netAmount
  
  let i = (monthlyPayment / netAmount) - (1 / termMonths); // Better initial guess
  if (isNaN(i) || !isFinite(i)) i = 0.001;

  for (let iteration = 0; iteration < 20; iteration++) {
    const powN = Math.pow(1 + i, -termMonths);
    const f = monthlyPayment * (1 - powN) - i * netAmount;
    const df = monthlyPayment * termMonths * Math.pow(1 + i, -termMonths - 1) - netAmount;
    
    if (!df) break;
    const nextI = i - f / df;
    
    if (isNaN(nextI) || !isFinite(nextI)) break;
    if (Math.abs(nextI - i) < 0.0000001) {
      i = nextI;
      break;
    }
    i = nextI;
  }
  
  // APR = (1 + i)^12 - 1
  const aprValue = (Math.pow(1 + i, 12) - 1) * 100;
  return isNaN(aprValue) ? 0 : aprValue;
}

/**
 * Calculates the monthly payment that would result in a specific APR, 
 * considering the net amount (amount - fees).
 */
export function calculateEffectiveMonthlyPayment(
  amount: number,
  termMonths: number,
  openingFeeValue: number,
  apr: number
): number {
  if (!amount || !termMonths || isNaN(apr)) return 0;
  
  // apr = (1 + i)^12 - 1  => 1 + i = (1 + apr/100)^(1/12)
  const monthlyRate = Math.pow(1 + (apr || 0) / 100, 1/12) - 1;
  const netAmount = amount - (openingFeeValue || 0);
  
  if (monthlyRate <= 0) return netAmount / termMonths;
  
  const payment = (netAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return isNaN(payment) ? 0 : payment;
}

/**
 * Calculates the total monthly cost including the loan installment and recurring fees.
 */
export function calculateTotalMonthlyCost(
  input: LoanInput,
  baseMonthlyPayment: number,
  openingFee: number,
  financedAmount: number
): { totalEffectiveMonthly: number; additionalCostsFromApr: number; bankApr: number; realCalculatedApr: number } {
  const realCalculatedApr = calculateAPR(financedAmount, baseMonthlyPayment, input.termMonths, openingFee);
  const bankApr = input.userProvidedApr || realCalculatedApr;
  
  const totalEffectiveFromBankApr = calculateEffectiveMonthlyPayment(financedAmount, input.termMonths, openingFee, bankApr);
  const additionalCostsFromApr = Math.max(0, totalEffectiveFromBankApr - baseMonthlyPayment);
  
  const totalEffectiveMonthly = baseMonthlyPayment + input.recurringMonthlyCosts + additionalCostsFromApr;
  
  return {
    totalEffectiveMonthly,
    additionalCostsFromApr,
    bankApr,
    realCalculatedApr
  };
}

export function calculateLoanScore(
  input: LoanInput, 
  totalInterest: number
): { score: number; label: string; color: string; feedback: string } {
  const { annualInterestRate, termMonths, amount } = input;
  
  // 1. Score by Interest Rate (Max 40 points)
  // Ideal: 1.5% or less. Bad: 7% or more.
  let scoreRate = 0;
  if (annualInterestRate <= 1.5) scoreRate = 40;
  else if (annualInterestRate >= 7) scoreRate = 0;
  else scoreRate = 40 * (1 - (annualInterestRate - 1.5) / (7 - 1.5));

  // 2. Score by Interest Ratio (Total Interest / Principal) (Max 40 points)
  // Paying more than 100% of principal in interest is bad.
  // Ideal: < 20% (Ratio 0.2). Heavy: > 120% (Ratio 1.2).
  const interestRatio = totalInterest / amount;
  let scoreRatio = 0;
  if (interestRatio <= 0.2) scoreRatio = 40;
  else if (interestRatio >= 1.2) scoreRatio = 0;
  else scoreRatio = 40 * (1 - (interestRatio - 0.2) / (1.2 - 0.2));

  // 3. Score by Term (Time) (Max 20 points)
  // Shorter is generally safer/cheaper but harder on monthly cashflow.
  // Ideal: 10 years (120m). Long: 30 years (360m).
  let scoreTerm = 0;
  if (termMonths <= 120) scoreTerm = 20;
  else if (termMonths >= 480) scoreTerm = 0;
  else scoreTerm = 20 * (1 - (termMonths - 120) / (480 - 120));

  const totalScore = Math.max(0, Math.min(100, Math.round(scoreRate + scoreRatio + scoreTerm)));
  
  let label = 'Aceptable';
  let color = 'text-yellow-600';
  let feedback = 'El préstamo tiene condiciones estándar. Es equilibrado pero tiene margen de mejora.';

  if (totalScore >= 85) {
    label = 'Excelente';
    color = 'text-green-600';
    feedback = 'Financieramente impecable. Intereses bajos y un coste total controlado respecto al capital solicitado.';
  } else if (totalScore >= 70) {
    label = 'Muy Bueno';
    color = 'text-emerald-500';
    feedback = 'Condiciones muy competitivas. El impacto de los intereses es moderado y el plazo es adecuado.';
  } else if (totalScore < 50) {
    label = 'Caro / Riesgoso';
    color = 'text-red-500';
    feedback = 'El coste total es muy elevado comparado con el capital. Considera reducir plazo o buscar un interés menor.';
  }

  return { 
    score: totalScore, 
    label, 
    color, 
    feedback 
  };
}
