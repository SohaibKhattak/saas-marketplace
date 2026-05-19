import "dotenv/config";
import { supabase } from "./config/supabase.js";

async function main() {
  console.log("Checking transactions...");
  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (txError) {
    console.error("Tx Error:", txError);
  } else {
    console.log("Recent Transactions:", txs);
  }

  console.log("\nChecking payouts...");
  const { data: payouts, error: payoutError } = await supabase
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (payoutError) {
    console.error("Payout Error:", payoutError);
  } else {
    console.log("Recent Payouts:", payouts);
  }

  console.log("\nChecking developer profiles...");
  const { data: devs, error: devError } = await supabase
    .from("developer_profiles")
    .select("id, stripe_account_id, user_id");

  if (devError) {
    console.error("Dev Error:", devError);
  } else {
    console.log("Developer Profiles:", devs);
  }
}

main().catch(console.error);
