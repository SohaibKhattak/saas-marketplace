import "dotenv/config";
import { supabase } from "./config/supabase.js";

async function main() {
  console.log("Backfilling missing payout for transaction: 1a1e677f-14a2-4371-8bd3-5bc391ff4e63");

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", "1a1e677f-14a2-4371-8bd3-5bc391ff4e63")
    .single();

  if (txError || !tx) {
    console.error("Failed to fetch transaction:", txError);
    return;
  }

  // Get invoice dates if possible, or fallback to created_at
  const periodStart = new Date(tx.created_at);
  const periodEnd = new Date(tx.created_at);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // Mock 1 month period

  const { error: payoutError } = await supabase.from("payouts").insert({
    developer_id: tx.developer_id,
    amount: tx.developer_amount,
    currency: tx.currency || "usd",
    status: "COMPLETED",
    stripe_transfer_id: null,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    processed_at: new Date().toISOString(),
  });

  if (payoutError) {
    console.error("Failed to insert payout:", payoutError);
  } else {
    console.log("Successfully backfilled payout!");
  }
}

main().catch(console.error);
