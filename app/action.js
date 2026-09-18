"use server"

import {createClient } from "@/utils/supabase/server";
import { scrapeProduct } from "@/lib/firecrawl";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPriceDropEmail } from "@/lib/resend";

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    redirect("/");
}

export async function addProduct(formData) {
    const url = formData.get("url");
    const targetPriceRaw = formData.get("targetPrice");
    const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;

    if (!url) {
        return { error: "URL is required" };
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Not authenticated" };
        }

        // Scrape product data with Firecrawl
        const productData = await scrapeProduct(url);
        console.log("SCRAPED PRODUCT DATA:");
        console.log(productData);

        if (!productData.productName || !productData.currentPrice) {
            console.log(productData, "productData");
            return { error: "Could not extract product information from this URL" };
        }

        const newPrice = parseFloat(
            String(productData.currentPrice)
               .replace(/[^\d.]/g, "")
        );

        console.log("Raw Price:", productData.currentPrice);
        console.log("Parsed Price:", newPrice);

        if (!newPrice || Number.isNaN(newPrice)) {
           return {
            error: `Price not found. Firecrawl returned: ${JSON.stringify(productData)}`
          };
        }
        console.log("Scraped Data:", productData);
        console.log("Price:", productData.currentPrice);
        console.log("Parsed Price:", newPrice);
        let currency = productData.currencyCode;

        if (currency === "₹") currency = "INR";
        if (currency === "$") currency = "USD";
        if (currency === "€") currency = "EUR";

        currency = currency || "INR";

         // Check if product exists to determine if it's an update
        const { data: existingProduct } = await supabase
            .from("products")
            .select("id, current_price")
            .eq("user_id", user.id)
            .eq("url", url)
            .single();

        const isUpdate = !!existingProduct;

        // Upsert product (insert or update based on user_id + url)
const productPayload = {
    user_id: user.id,
    url,
    name: productData.productName,
    current_price: newPrice,
    currency: currency,
    image_url: productData.productImageUrl,
    updated_at: new Date().toISOString(),
};

if (targetPrice !== null && !Number.isNaN(targetPrice)) {
    productPayload.target_price = targetPrice;
    productPayload.last_notified_price = null;
}

const { data: product, error } = await supabase
    .from("products")
    .upsert(
    productPayload,
    {
        onConflict: "user_id,url",
        ignoreDuplicates: false,
    }
)
    .select()
    .single();

       
        if (error) throw error;
        
        // Add to price history if it's a new product OR price changed
        const shouldAddHistory =
            !isUpdate || existingProduct.current_price !== newPrice;

        if (shouldAddHistory) {
            const { error: historyError } = await supabase
                .from("price_history")
                .insert({
                    product_id: product.id,
                    price: newPrice,
                    currency: currency,
                    checked_at: new Date().toISOString(),
                });

            if (historyError) {
                console.error("Failed to insert price history:", historyError);
            }
        }

        // Price-drop email trigger
        const targetPriceHit =
            product.target_price !== null &&
            product.target_price !== undefined &&
            newPrice <= product.target_price;

        const alreadyNotifiedForThisPrice =
            product.last_notified_price !== null &&
            product.last_notified_price !== undefined &&
            newPrice >= product.last_notified_price;

        if (targetPriceHit && !alreadyNotifiedForThisPrice && user.email) {
            await sendPriceDropEmail({
                to: user.email,
                productName: product.name,
                url: product.url,
                targetPrice: product.target_price,
                currentPrice: newPrice,
                currency: currency,
            });

            await supabase
                .from("products")
                .update({ last_notified_price: newPrice })
                .eq("id", product.id);
        }

        revalidatePath("/");
        return {
            success: true,
            product,
            message: isUpdate
                ? "Product updated with latest price!"
                : "Product added successfully!",
        };
    } catch (error) {
    console.error("Add product error:", error);
    return { error: error.message || "Failed to add product" };
    }
}

export async function deleteProduct(productId) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", productId);

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
}


export async function updateTargetPrice(productId, targetPrice) {
    try {
        const supabase = await createClient();
        const price =
            targetPrice === "" || targetPrice === null
                ? null
                : parseFloat(targetPrice);

        if (price !== null && Number.isNaN(price)) {
            return { error: "Invalid target price" };
        }

        const { error } = await supabase
            .from("products")
            .update({ target_price: price, last_notified_price: null })
            .eq("id", productId);

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
}


export async function getProducts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getPriceHistory(productId) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("price_history")
            .select("*")
            .eq("product_id", productId)
            .order("checked_at", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Get price history error:", error);
        return [];
    }
}