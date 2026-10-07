// Money formatting for INR (minor units → display)
export const formatMoney = (amount, { minor = false, withSymbol = true } = {}) => {
    const value = minor ? Number(amount || 0) / 100 : Number(amount || 0);
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(value);
    return withSymbol ? formatted : formatted.replace('₹', '').trim();
};

export const formatMoneyMinor = (minorAmount) => formatMoney(minorAmount, { minor: true });

export default formatMoney;
