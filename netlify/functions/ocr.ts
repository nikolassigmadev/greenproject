import type { Context } from "@netlify/functions";

export default async (request: Request, _context: Context) => {
  // Only allow POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "OpenAI API key not configured. Set OPENAI_API_KEY in Netlify environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { image: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.image) {
    return new Response(JSON.stringify({ error: "Missing image field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Strip data URL prefix if present
  let base64Image = body.image;
  if (base64Image.includes(",")) {
    base64Image = base64Image.split(",")[1];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: `What product is shown? Reply in exactly this format:\nProduct: <product name>\nBrand: <brand name>\nBarcode: <barcode digits, or none>\n\nOnly use text visible on the packaging. Do not guess.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";

    // Parse the structured response
    const productMatch = rawText.match(/Product:\s*(.+)/i);
    const brandMatch = rawText.match(/Brand:\s*(.+)/i);
    const barcodeMatch = rawText.match(/Barcode:\s*(.+)/i);

    const sanitize = (v: string | null) => {
      if (!v) return null;
      const t = v.trim();
      if (/^\[.*\]$|^<.*>$|^unknown|^n\/a$|^none$|^not visible$/i.test(t)) return null;
      if (t.length < 2) return null;
      return t;
    };

    const productName = sanitize(productMatch ? productMatch[1] : null);
    const brandName = sanitize(brandMatch ? brandMatch[1] : null);
    const extractedBarcode = barcodeMatch ? barcodeMatch[1].trim() : null;
    const barcode =
      extractedBarcode &&
      extractedBarcode.toLowerCase() !== "none" &&
      /^\d{8,14}$/.test(extractedBarcode.replace(/\s/g, ""))
        ? extractedBarcode.replace(/\s/g, "")
        : null;

    return new Response(
      JSON.stringify({
        success: !!(productName || brandName),
        productName,
        brandName,
        barcode,
        rawText,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/.netlify/functions/ocr",
};
