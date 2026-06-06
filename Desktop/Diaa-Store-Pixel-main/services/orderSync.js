const db = require('../database/db');
const AiDoneClient = require('./aidone');
const { notifyOrderUpdate } = require('./webhook');

let syncInterval = null;

function startOrderSync() {
    console.log('[OrderSync] Background job started (every 30s)');
    syncInterval = setInterval(async () => {
        try { await syncOrders(); } catch (err) { console.error('[OrderSync] Error:', err.message); }
    }, 30000);
    setTimeout(() => syncOrders().catch(console.error), 5000);
}

function stopOrderSync() {
    if (syncInterval) { clearInterval(syncInterval); syncInterval = null; console.log('[OrderSync] Background job stopped'); }
}

async function syncOrders() {
    const orders = await db.getPendingAndRunningOrders();
    if (orders.length === 0) return;
    console.log(`[OrderSync] Checking ${orders.length} active orders...`);

    for (const order of orders) {
        if (!order.remote_task_id || !order.source_cdkey) continue;
        try {
            const result = await AiDoneClient.getStatus(order.source_cdkey, order.email, order.remote_task_id);
            if (!result.success || !result.data) continue;

            const remoteStatus = result.data.status?.toLowerCase();
            const currentStatus = order.status;
            let newStatus = currentStatus;
            if (remoteStatus === 'success' || remoteStatus === 'completed') newStatus = 'success';
            else if (remoteStatus === 'failed' || remoteStatus === 'error') newStatus = 'failed';
            else if (remoteStatus === 'running' || remoteStatus === 'processing') newStatus = 'running';

            const hasOfferUrl = !!result.data.has_offer_url;
            const offerUrl = result.data.offer_url || '';
            const message = result.data.message || '';

            // ── CRITICAL FIX: if task_type=extract succeeded but offer_url is missing,
            //    keep the order in 'running' state until link arrives (don't lose it)
            if (newStatus === 'success' && (order.task_type === 'extract' || order.task_type === 'full') && !offerUrl && !hasOfferUrl) {
                console.log(`[OrderSync] Order #${order.id} reported success but NO offer_url yet — keeping as running`);
                if (currentStatus !== 'running') {
                    await db.updateOrderStatus('running', 'Processing — waiting for link...', '', false, order.id);
                }
                continue; // don't proceed to mark as success
            }

            if (newStatus !== currentStatus) {
                await db.updateOrderStatus(newStatus, message, offerUrl, hasOfferUrl, order.id);

                if (newStatus === 'failed') {
                    const cdk = await db.getPlatformCDK(order.cdk_id);
                    if (cdk) {
                        await db.updatePlatformCDKPoints(cdk.remaining_points + order.charged_points, order.cdk_id);
                        await db.insertLog(order.cdk_id, order.id, 'refund', `Refunded ${order.charged_points} points — ${message}`);
                    }
                    console.log(`[OrderSync] Order #${order.id} FAILED → Refunded ${order.charged_points} points`);
                } else if (newStatus === 'success') {
                    await db.insertLog(order.cdk_id, order.id, 'success', `Order completed — ${message}`);
                    console.log(`[OrderSync] Order #${order.id} SUCCESS — offer_url: ${offerUrl ? 'YES' : 'MISSING'}`);
                }

                if (order.webhook_url) {
                    await notifyOrderUpdate(order.webhook_url, {
                        id: order.id, email: order.email, status: newStatus, task_type: order.task_type,
                        result_message: message, offer_url: offerUrl, has_offer_url: hasOfferUrl
                    });
                }
            }
        } catch (err) {
            console.error(`[OrderSync] Error checking order #${order.id}:`, err.message);
        }
    }
}

module.exports = { startOrderSync, stopOrderSync, syncOrders };
