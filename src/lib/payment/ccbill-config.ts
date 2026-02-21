// CCBill FlexForms configuration constants and helpers

export const CCBILL_FLEXFORMS_URL =
  "https://api.ccbill.com/wap-frontflex/flexforms";

interface CcbillConfig {
  accountNumber: string;
  subaccount: string;
  flexformId: string;
  salt: string;
}

/**
 * Reads CCBill configuration from process.env.
 * Uses process.env directly (not env.ts import) to match db/index.ts pattern
 * and avoid circular dependencies at build time.
 * Throws descriptive error if any required value is missing (lazy validation).
 */
export function getCcbillConfig(): CcbillConfig {
  const accountNumber = process.env.CCBILL_ACCOUNT_NUMBER;
  const subaccount = process.env.CCBILL_SUBACCOUNT;
  const flexformId = process.env.CCBILL_FLEXFORM_ID;
  const salt = process.env.CCBILL_SALT;

  const missing: string[] = [];
  if (!accountNumber) missing.push("CCBILL_ACCOUNT_NUMBER");
  if (!subaccount) missing.push("CCBILL_SUBACCOUNT");
  if (!flexformId) missing.push("CCBILL_FLEXFORM_ID");
  if (!salt) missing.push("CCBILL_SALT");

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "development") {
      return {
        accountNumber: "000000",
        subaccount: "0000",
        flexformId: "dev-placeholder",
        salt: "dev-placeholder-salt",
      };
    }
    throw new Error(
      `Missing required CCBill environment variables: ${missing.join(", ")}. ` +
        `See CCBill Merchant Admin for these values.`
    );
  }

  return {
    accountNumber: accountNumber!,
    subaccount: subaccount!,
    flexformId: flexformId!,
    salt: salt!,
  };
}
