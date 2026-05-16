
function calculate(amount, annualRate, terms) {
    const monthlyRate = annualRate / 100 / 12;
    const pmt = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -terms));
    
    let balance = amount;
    let totalInterest = 0;
    
    // Simple 30/360
    for(let i=0; i<terms; i++) {
        let interest = balance * monthlyRate;
        totalInterest += interest;
        balance -= (pmt - interest);
    }
    console.log("30/360 Interest:", totalInterest);
    
    // Actual/360 (Approximation with avg month 30.4375 days)
    balance = amount;
    totalInterest = 0;
    const dailyRate = annualRate / 100 / 360;
    const avgDays = 365.25 / 12;
    for(let i=0; i<terms; i++) {
        let interest = balance * dailyRate * avgDays;
        totalInterest += interest;
        balance -= (pmt - interest);
    }
    console.log("Actual/360 (Avg Month) Interest:", totalInterest);

    // Actual/365 (Approximation)
    balance = amount;
    totalInterest = 0;
    const dailyRate365 = annualRate / 100 / 365;
    for(let i=0; i<terms; i++) {
        let interest = balance * dailyRate365 * avgDays;
        totalInterest += interest;
        balance -= (pmt - interest);
    }
    console.log("Actual/365 (Avg Month) Interest:", totalInterest);
}

calculate(10000, 6.5, 72);
