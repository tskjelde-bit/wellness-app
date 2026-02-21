import { CCBILL_FLEXFORMS_URL, getCcbillConfig } from "./ccbill-config";

/**
 * Generates a CCBill FlexForms checkout URL for the given user.
 *
 * @param userId - The user's ID, passed as custom1 for webhook correlation
 * @param origin - The request origin (e.g., "https://example.com") for return URLs
 * @returns Full CCBill FlexForms checkout URL string
 */
export function generateCheckoutUrl(userId: string, origin: string): string {
  const config = getCcbillConfig();

  const url = new URL(CCBILL_FLEXFORMS_URL);
  url.searchParams.set("formName", config.flexformId);
  url.searchParams.set("clientAccnum", config.accountNumber);
  url.searchParams.set("clientSubacc", config.subaccount);
  // Pass userId as custom field for webhook correlation (Pitfall 4 prevention)
  url.searchParams.set("custom1", userId);
  // Derive return URLs from request origin (no env vars needed)
  url.searchParams.set("successUrl", `${origin}/subscribe/success`);
  url.searchParams.set("failureUrl", `${origin}/subscribe/failure`);

  return url.toString();
}
