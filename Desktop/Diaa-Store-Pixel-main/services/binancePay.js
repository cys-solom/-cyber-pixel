const crypto = require('crypto');

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const MERCHANT_UID = process.env.BINANCE_MERCHANT_UID;
const BASE_URL = 'https://api.binance.com';

// Cache server time offset to fix clock skew issues
let _timeOffset = 0;
let _lastTimeSyncAt = 0;

async function getServerTimeOffset() {
    const now = Date.now();
    if (now - _lastTimeSyncAt < 60000) return _timeOffset; // Cache 60s
    try {
        const r = await fetch(`${BASE_URL}/api/v3/time`);
        const d = await r.json();
        _timeOffset = (d.serverTime || now) - Date.now();
        _lastTimeSyncAt = Date.now();
        console.log(`[BinancePay] Time offset synced: ${_timeOffset}ms`);
    } catch (e) {
        console.error('[BinancePay] Time sync failed:', e.message);
    }
    return _timeOffset;
}

function signQuery(queryString) {
    return crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
}

/**
 * Get Binance Pay transaction history (uses server time to avoid clock skew)
 */
async function getPayTransactions(startTime, endTime) {
    const offset = await getServerTimeOffset();
    const timestamp = Date.now() + offset;
    let query = `timestamp=${timestamp}&recvWindow=60000`;
    if (startTime) query += `&startTimestamp=${startTime}`;
    if (endTime)   query += `&endTimestamp=${endTime}`;

    const signature = signQuery(query);
    query += `&signature=${signature}`;

    try {
        const res = await fetch(`${BASE_URL}/sapi/v1/pay/transactions?${query}`, {
            headers: { 'X-MBX-APIKEY': API_KEY }
        });
        const data = await res.json();

        // Binance Pay API returns code "000000" for success (not 200)
        if (data.code && data.code !== '000000' && data.code !== 200 && data.code !== 0) {
            console.error('[BinancePay] API Error:', data.code, data.message || data.msg);
            return { success: false, error: data.message || data.msg };
        }

        const txns = data.data || data || [];
        return { success: true, transactions: Array.isArray(txns) ? txns : [] };
    } catch (err) {
        console.error('[BinancePay] Request error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Check for a specific deposit by note or amount
 */
async function findDeposit(uniqueAmount, afterTime) {
    const result = await getPayTransactions(afterTime - 60000);
    if (!result.success) return null;

    const txns = result.transactions;
    for (const tx of txns) {
        const txAmount = Math.abs(parseFloat(tx.amount || tx.transactionAmount || 0));
        const txCurrency = (tx.currency || tx.transCurrency || '').toUpperCase();
        if (txCurrency === 'USDT' && Math.abs(txAmount - uniqueAmount) < 0.005) {
            return tx;
        }
    }
    return null;
}

/**
 * Generate a unique amount by adding cents to make it identifiable
 * e.g., $10 → $10.37
 */
function generateUniqueAmount(baseAmount) {
    const suffix = Math.floor(Math.random() * 90 + 10);
    return parseFloat((parseFloat(baseAmount) + suffix / 100).toFixed(2));
}

module.exports = { getPayTransactions, findDeposit, generateUniqueAmount, MERCHANT_UID };
