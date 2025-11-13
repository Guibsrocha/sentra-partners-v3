import express from 'express';
import crypto from 'crypto';
import { Request, Response } from 'express';

const router = express.Router();

// NowPayments webhook endpoint
router.post('/api/webhook/nowpayments', async (req: Request, res: Response) => {
  try {
    const body = JSON.stringify(req.body);
    
    // Verify IPN signature (you can add this verification)
    // const signature = req.headers['x-nowpayments-sig'] as string;
    // const secret = 'd08de432-0a80-4b50-ae0a-401ae79a3ddb'; // Your IPN secret
    
    console.log('NowPayments webhook received:', req.body);
    
    const { 
      payment_status, 
      order_id, 
      order_description,
      pay_address,
      pay_amount,
      pay_currency 
    } = req.body;

    // Handle different payment statuses
    switch (payment_status) {
      case 'finished':
        console.log(`✅ Payment completed for order ${order_id}`);
        // Here you would activate the user's subscription or VPS
        await handleSuccessfulPayment(order_id, order_description);
        break;
        
      case 'partially_paid':
        console.log(`⏳ Payment partially completed for order ${order_id}`);
        break;
        
      case 'failed':
        console.log(`❌ Payment failed for order ${order_id}`);
        await handleFailedPayment(order_id);
        break;
        
      case 'expired':
        console.log(`⏰ Payment expired for order ${order_id}`);
        break;
        
      default:
        console.log(`ℹ️ Payment status: ${payment_status} for order ${order_id}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

async function handleSuccessfulPayment(orderId: string, description: string) {
  try {
    console.log(`🚀 Activating service for order: ${orderId}`);
    console.log(`📋 Description: ${description}`);
    
    // Extract plan name from description
    const planName = description.replace('Sentra Partners - ', '');
    
    // Here you would implement the actual service activation:
    // - Create VPS instance
    // - Activate subscription
    // - Send confirmation email
    // - Grant EA access
    
    // Example implementation:
    // await activateVPS(planName);
    // await activateSubscription(planName);
    // await sendConfirmationEmail(userEmail, planName);
    
  } catch (error) {
    console.error('Error activating service:', error);
  }
}

async function handleFailedPayment(orderId: string) {
  try {
    console.log(`⚠️ Handling failed payment for order: ${orderId}`);
    
    // Here you would:
    // - Log the failed payment attempt
    // - Send failure notification
    // - Clean up any temporary resources
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

export default router;