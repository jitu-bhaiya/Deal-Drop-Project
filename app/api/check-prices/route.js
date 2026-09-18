import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropEmail } from "@/lib/resend";

export const maxDuration = 300;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userEmailCache = new Map();
  const results = [];

  for (const product of products || []) {
    try {
      const scraped = await scrapeProduct(product.url);
      const newPrice = parseFloat(scraped.currentPrice);

      if (!newPrice || Number.isNaN(newPrice)) {
        results.push({ id: product.id, status: "skipped-no-price" });
        continue;
      }

      const priceChanged = newPrice !== product.current_price;

      if (priceChanged) {
        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        await supabase.from("price_history").insert({
          product_id: product.id,
          price: newPrice,
          currency: scraped.currencyCode || product.currency,
        });
      }

      const hitTarget =
        product.target_price != null &&
        newPrice <= product.target_price &&
        product.last_notified_price !== newPrice;

      if (hitTarget) {
        let email = userEmailCache.get(product.user_id);

        if (!email) {
          const { data: userData } = await supabase.auth.admin.getUserById(
            product.user_id
          );
          email = userData?.user?.email;
          if (email) userEmailCache.set(product.user_id, email);
        }

        if (email) {
          await sendPriceDropEmail({
            to: email,
            productName: product.name,
            url: product.url,
            targetPrice: product.target_price,
            currentPrice: newPrice,
            currency: product.currency,
          });

          await supabase
            .from("products")
            .update({ last_notified_price: newPrice })
            .eq("id", product.id);
        }
      }

      results.push({ id: product.id, status: "checked", newPrice });
    } catch (err) {
      console.error(`Failed to check product ${product.id}:`, err);
      results.push({ id: product.id, status: "error", error: err.message });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}