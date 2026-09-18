import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPriceDropEmail({
  to,
  productName,
  url,
  targetPrice,
  currentPrice,
  currency,
}) {
  try {
    const data = await resend.emails.send({
      from: "DealDrop <onboarding@resend.dev>",
      to,
      subject: `🎉 Price Drop: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #111;">Price Drop Alert 📉</h2>

          <p>
            <strong>${productName}</strong> just hit your target price!
          </p>

          <p style="font-size:28px;font-weight:bold;color:#f97316;">
            ${currency} ${currentPrice}
          </p>

          <p>
            Your target was ${currency} ${targetPrice}
          </p>

          <a
            href="${url}"
            style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;"
          >
            View Product
          </a>
        </div>
      `,
    });

    console.log("Email sent:", data);
  } catch (error) {
    console.error("Failed to send price drop email:", error);
  }
}