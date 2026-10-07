const toMinor = (amount) => Math.round(Number(amount || 0) * 100);
const fromMinor = (minor) => Number(minor || 0) / 100;
const addLine = (unitMinor, quantity) => unitMinor * quantity;
const applyBps = (minor, bps) => Math.round((minor * bps) / 10000);
const splitCgstSgst = (minor) => {
    const cgst = Math.round(minor / 2);
    return { cgst, sgst: minor - cgst };
};
const roundHalfUp = (n) => Math.round(Number(n));

module.exports = {
    toMinor,
    fromMinor,
    addLine,
    applyBps,
    splitCgstSgst,
    roundHalfUp,
    TAX_BPS: 500,
};
