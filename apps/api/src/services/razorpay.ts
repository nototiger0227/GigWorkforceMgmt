import { env } from '../config/env.js';

export interface TransferResult {
  providerId: string;
  status: 'processed' | 'pending' | 'failed';
}

/** RazorpayX payout stub — uses sandbox when keys are not set. */
export async function createUpiTransfer(
  amount: number,
  upiId: string,
  referenceId: string,
): Promise<TransferResult> {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    console.log(`[razorpay:sandbox] UPI ₹${amount} → ${upiId} (ref ${referenceId})`);
    return { providerId: `sandbox_${referenceId}`, status: 'processed' };
  }

  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_number: env.razorpayAccountNumber,
      amount: Math.round(amount * 100),
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      fund_account: {
        account_type: 'vpa',
        vpa: { address: upiId },
        contact: { name: 'Rider', type: 'vendor' },
      },
      reference_id: referenceId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay error: ${err}`);
  }

  const data = (await res.json()) as { id: string; status: string };
  return {
    providerId: data.id,
    status: data.status === 'processed' ? 'processed' : 'pending',
  };
}
