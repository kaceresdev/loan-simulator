/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LoanInput, AmortizationRow } from '../types';
import { calculateAPR, calculateLoanScore, formatCurrency, calculateEffectiveMonthlyPayment, calculateTotalMonthlyCost } from '../lib/financials';
import { GoogleGenAI } from '@google/genai';
import { ShieldCheck, Info, Sparkles, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface LoanAnalysisProps {
  input: LoanInput;
  schedule: AmortizationRow[];
}

export const LoanAnalysis: React.FC<LoanAnalysisProps> = ({ input, schedule }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const totalInterest = schedule[schedule.length - 1]?.accumulatedInterest || 0;
  
  const openingFee = input.openingFeeType === 'percent' 
    ? ((input.amount + (input.insuranceSinglePremium || 0)) * input.openingFeeValue / 100)
    : input.openingFeeValue;

  const financedAmount = input.amount + 
    (input.isOpeningFeeFinanced ? openingFee : 0) + 
    (input.isInsuranceFinanced ? (input.insuranceSinglePremium || 0) : 0);
    
  const baseMonthlyPayment = schedule[0]?.monthlyLoanPayment || 0;
  
  // For TAE, the net amount received is ALWAYS the base "input.amount" 
  // because the opening fee is either paid upfront or subtracted from hand.
  // If financed, user gets "input.amount" but owes "input.amount + fee".
  // If not financed, user gets "input.amount" but pays "fee" from pocket (net input.amount - fee).
  const netAmountForApr = input.amount - (input.isOpeningFeeFinanced ? 0 : openingFee);

  const { 
    totalEffectiveMonthly, 
    additionalCostsFromApr, 
    bankApr, 
    realCalculatedApr 
  } = calculateTotalMonthlyCost(input, baseMonthlyPayment, openingFee, financedAmount);
  
  const totalHiddenCost = (input.recurringMonthlyCosts + additionalCostsFromApr) * input.termMonths;
  const hasHiddenCosts = bankApr > realCalculatedApr + 0.01;

  const totalProjectCost = totalInterest + financedAmount + 
    (input.isOpeningFeeFinanced ? 0 : openingFee) + 
    (input.isInsuranceFinanced ? 0 : (input.insuranceSinglePremium || 0)) +
    totalHiddenCost;
  
  const stats = calculateLoanScore(input, totalInterest + totalHiddenCost); // include hidden costs in objective rating

  // TODO: Revisar integración con IA
  // useEffect(() => {
  //   const fetchAiAnalysis = async () => {
  //     if (!process.env.GEMINI_API_KEY) return;
      
  //     setLoading(true);
      // try {
      //   // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      //   // const response = await ai.models.generateContent({
      //   //   model: "gemini-3-flash-preview",
      //   //   contents: `Analiza este préstamo considerando nuestra valoración de ${stats.score}/100.
          
      //   //   Datos:
      //   //   Capital solicitado: ${formatCurrency(input.amount)}
      //   //   Financiado (Apertura/Seguro): ${formatCurrency(financedAmount)}
      //   //   Cuota Base Préstamo: ${formatCurrency(baseMonthlyPayment)}
      //   //   Gastos Mensuales (Seguros/Mant.): ${formatCurrency(input.recurringMonthlyCosts + additionalCostsFromApr)}/mes
      //   //   Cuota Mensual Total: ${formatCurrency(totalEffectiveMonthly)}
      //   //   TAE: ${bankApr.toFixed(2)}%
      //   //   Comisión Apertura: ${formatCurrency(openingFee)}
      //   //   Coste Total del Proyecto (Capital + Todo): ${formatCurrency(totalProjectCost)}
          
      //   //   ${hasHiddenCosts ? `ALERTA: Se han detectado ${formatCurrency(totalHiddenCost)} en costes que elevan la TAE respecto al interés nominal.` : ''}
          
      //   //   Tu análisis DEBE ser consistente con la valoración "${stats.label}".
      //   //   Explica brevemente por qué sale esa cuota y da 2 consejos.`,
      //   // });
        
      //   setAiAnalysis(response.text || "No se pudo generar el análisis.");
      // } catch (error) {
      //   console.error("AI Analysis error:", error);
      //   setAiAnalysis("Error conectando con el asesor inteligente.");
      // } finally {
      //   setLoading(false);
      // }
    // };

    // fetchAiAnalysis();
  // }, [input.amount, input.annualInterestRate, input.termMonths, totalInterest, stats.label, stats.score, bankApr, input.recurringMonthlyCosts, additionalCostsFromApr]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="stat-card bg-white border border-border-base rounded-md p-5 flex flex-col shadow-sm border-t-2 border-t-primary">
          <span className="stat-label text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
            Cuota Mensual Total
            <TrendingUp className="w-3 h-3 text-primary opacity-50" />
          </span>
          <span className="stat-value text-2xl font-bold text-text-main">
            {formatCurrency(totalEffectiveMonthly)}
          </span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between text-[10px] text-text-muted font-medium">
              <span>PRÉSTAMO: {formatCurrency(baseMonthlyPayment)}</span>
              <span className="text-primary font-bold">TAE: {bankApr.toFixed(2)}%</span>
            </div>
            {(input.recurringMonthlyCosts + additionalCostsFromApr) > 0 && (
              <div className="flex items-center justify-between text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                <span>Otros Gastos:</span>
                <span>+{formatCurrency(input.recurringMonthlyCosts + additionalCostsFromApr)}/mes</span>
              </div>
            )}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
               <div 
                 className="bg-primary h-full" 
                 style={{ width: `${(baseMonthlyPayment / totalEffectiveMonthly) * 100}%` }} 
               />
               <div 
                 className="bg-amber-400 h-full" 
                 style={{ width: `${((input.recurringMonthlyCosts + additionalCostsFromApr) / totalEffectiveMonthly) * 100}%` }} 
               />
            </div>
            <p className="text-[10px] text-text-muted font-medium uppercase">Total Intereses: {formatCurrency(totalInterest)}</p>
          </div>
        </div>

        <div className="stat-card bg-white border border-border-base border-l-4 border-l-success rounded-md p-5 flex flex-col shadow-sm health-indicator">
          <span className="stat-label text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Calificación Objetiva</span>
          <div className="flex items-center gap-3">
            <span className={`stat-value text-2xl font-bold ${stats.color}`}>{stats.label}</span>
            <span className="badge badge-good px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
              { (stats.score / 10).toFixed(1) } / 10
            </span>
          </div>
          <span className="text-[10px] text-text-muted mt-2 font-medium">COSTE TOTAL: {formatCurrency(totalProjectCost)}</span>
        </div>

        {/* TODO: Revisar integración con IA (No se ha implementado todavía)*/}
        {/* <div className="stat-card bg-white border border-border-base rounded-md p-5 flex flex-col shadow-sm col-span-1 md:col-span-2 lg:col-span-1 min-h-[120px]">
          <span className="stat-label text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            Análisis IA Smart
          </span>
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-text-muted animate-pulse">Analizando...</span>
            </div>
          ) : (
            <div className="text-[11px] text-text-main leading-relaxed overflow-y-auto max-h-[100px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {aiAnalysis}
            </div>
          )}
        </div> */}
      </div>

      {(hasHiddenCosts || openingFee > 0) && (
        <div className={`border rounded-md p-4 flex items-start gap-3 shadow-sm ${hasHiddenCosts ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-border-base'}`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${hasHiddenCosts ? 'text-amber-600' : 'text-text-muted'}`} />
          <div className="flex-1">
            <h4 className={`text-sm font-bold mb-1 ${hasHiddenCosts ? 'text-amber-900' : 'text-text-main'}`}>
              Desglose de Conceptos Adicionales
            </h4>
            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                El capital solicitado es de {formatCurrency(input.amount)}, pero la operación conlleva costes que incrementan tu pago mensual y el desembolso total:
              </p>
              <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-700">
                {input.insuranceSinglePremium > 0 && (
                   <li>
                     <span className="font-bold">Seguro (Prima Única):</span> {formatCurrency(input.insuranceSinglePremium)} 
                     {input.isInsuranceFinanced ? ' (Financiado en el préstamo)' : ' (Pago inicial único)'}.
                   </li>
                )}
                {openingFee > 0 && (
                   <li>
                     <span className="font-bold">Comisión de Apertura:</span> {formatCurrency(openingFee)} 
                     {input.isOpeningFeeFinanced ? ' (Financiada en las cuotas)' : ' (Pago inicial único)'}.
                   </li>
                )}
                {hasHiddenCosts && (
                  <li>
                    <span className="font-bold text-amber-700">Servicios Vinculados:</span> Estás pagando aproximadamente <span className="font-bold">{formatCurrency(input.recurringMonthlyCosts + additionalCostsFromApr)} extras al mes</span> (que suman un total de <span className="font-bold underline">{formatCurrency(totalHiddenCost)}</span> durante toda la vida del préstamo) en conceptos como seguros obligatorios o comisiones de mantenimiento que el banco incluye en la TAE.
                  </li>
                )}
              </ul>
              <p className="text-[10px] text-slate-500 font-medium italic pt-1 border-t border-slate-200">
                Total a desembolsar por la operación (Capital + Intereses + Gastos): <span className="text-sm font-bold text-slate-900">{formatCurrency(totalProjectCost)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
