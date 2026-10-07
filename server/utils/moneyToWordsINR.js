const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${TENS[t]}${o ? ` ${ONES[o]}` : ''}`.trim();
};

const threeDigits = (n) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const parts = [];
    if (h) parts.push(`${ONES[h]} Hundred`);
    if (rest) parts.push(twoDigits(rest));
    return parts.join(' ').trim();
};

/** Indian numbering: crore, lakh, thousand, hundred */
const moneyToWordsINR = (amount) => {
    const rupees = Math.floor(Math.abs(Number(amount) || 0));
    const paise = Math.round((Math.abs(Number(amount) || 0) - rupees) * 100);
    if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const rest = rupees % 1000;

    const words = [];
    if (crore) words.push(`${twoDigits(crore)} Crore`);
    if (lakh) words.push(`${twoDigits(lakh)} Lakh`);
    if (thousand) words.push(`${twoDigits(thousand)} Thousand`);
    if (rest) words.push(threeDigits(rest));

    let out = `Rupees ${words.join(' ')}`;
    if (paise) out += ` And ${twoDigits(paise)} Paise`;
    out += ' Only';
    return out.replace(/\s+/g, ' ').trim();
};

module.exports = { moneyToWordsINR };
