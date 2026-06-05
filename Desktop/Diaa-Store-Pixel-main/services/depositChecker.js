/**
 * Deposit Checker — polls Binance Pay transactions to match pending deposits
 * Matches by NOTE (most reliable) then falls back to exact USDT amount
 * Runs every 30 seconds + auto-expires deposits older than 15 minutes
 */
const db = require('../database/db');
const BinancePay = require('./binancePay');

let isChecking = false;

async function checkPendingDeposits() {
    if (isChecking) return;
    isChecking = true;

    try {
        // Auto-expire deposits older than 15 minutes
        const expiredCount = await db.expireOldDeposits();
        if (expiredCount > 0) {
            console.log(`[DepositCheck] Auto-expired ${expiredCount} deposit(s) (>15 min)`);
        }

        const pending = await db.getPendingDeposits();
        if (pending.length === 0) { isChecking = false; return; }

        console.log(`[DepositCheck] Checking ${pending.length} pending deposit(s)...`);

        // Fetch last 2 hours of transactions
        const since = Date.now() - 2 * 60 * 60 * 1000;
        const result = await BinancePay.getPayTransactions(since);

        if (!result.success || !Array.isArray(result.transactions)) {
            console.log('[DepositCheck] Could not fetch transactions:', result.error || 'No data');
            isChecking = false;
            return;
        }

        const txns = result.transactions;
        console.log(`[DepositCheck] Got ${txns.length} recent Binance Pay transaction(s)`);

        for (const deposit of pending) {
            const depositNote = (deposit.note || '').trim().toUpperCase();
            const depositAmt  = parseFloat(deposit.amount_usdt);

            const match = txns.find(tx => {
                const txAmt      = Math.abs(parseFloat(tx.amount || tx.transactionAmount || 0));
                const txCurrency = (tx.currency || tx.transCurrency || '').toUpperCase();
                const txNote     = (tx.note || tx.remark || tx.memo || '').trim().toUpperCase();
                // Only look at incoming USDT
                if (txCurrency !== 'USDT') return false;
                // Match by note first (most reliable)
                if (depositNote && txNote && txNote.includes(depositNote)) {
                    console.log(`[DepositCheck] Matched by NOTE: ${depositNote}`);
                    return true;
                }
                // Fallback: match by exact amount (within 1 cent)
                if (Math.abs(txAmt - depositAmt) < 0.01) {
                    console.log(`[DepositCheck] Matched by AMOUNT: $${depositAmt}`);
                    return true;
                }
                return false;
            });

            if (match) {
                console.log(`[DepositCheck] ✅ Deposit #${deposit.id} PAID — $${depositAmt} → ${deposit.points_credited} pts [note: ${deposit.note}]`);
                await db.updateDepositStatus('paid', deposit.id);
                await db.addPointsToCDK(deposit.points_credited, deposit.points_credited, deposit.cdk_id);
                await db.insertLog(deposit.cdk_id, null, 'deposit_paid',
                    `Deposit $${depositAmt} USDT confirmed — ${deposit.points_credited} points credited`
                );
            } else {
                console.log(`[DepositCheck] ⏳ No match yet for deposit #${deposit.id} [$${depositAmt}, note:${deposit.note}]`);
            }
        }
    } catch (err) {
        console.error('[DepositCheck] Error:', err.message);
    }

    isChecking = false;
}

function startDepositChecker() {
    console.log('[DepositCheck] Background checker started (every 30s, auto-expire 15min)');
    setInterval(checkPendingDeposits, 30 * 1000);
    setTimeout(checkPendingDeposits, 5 * 1000); // First check after 5s
}

module.exports = { startDepositChecker, checkPendingDeposits };
