export type CheckoutVerificationSummary = {
  paymentStatus: string;
  status: string;
};

export function isAuthoritativeCheckoutSuccess(
  summary: CheckoutVerificationSummary,
) {
  return summary.paymentStatus === 'paid'
    || summary.paymentStatus === 'processing';
}

export function isTerminalCheckoutFailure(
  summary: CheckoutVerificationSummary,
) {
  return summary.paymentStatus === 'failed'
    || summary.paymentStatus === 'refunded'
    || summary.status === 'expired';
}
