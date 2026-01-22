"use server";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  extractContent,
  extractCurrency,
  extractDescription,
  extractPrice,
  cleanAmazonUrl,
} from "../utlis";
import { getJson } from "serpapi";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import Product from "@/models/product.model";
interface Product {
  position: number;
  title: string;
  product_link: string;
  product_id: string;
  serpapi_product_api: string;
  source: string;
  price: string;
  extracted_price: number;
  second_hand_condition?: string;
  rating?: number;
  reviews?: number;
  extensions: any[];
  thumbnail: string;
  delivery?: string;
}

import { redis } from "../../app/config/ratelimit";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(4, "100s"),
});

export async function scrapeAmazonProducts(url: string) {
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;

  // Clean the URL - remove tracking parameters that might cause issues
  const cleanUrl = cleanAmazonUrl(url);
  console.log("🔗 Original URL:", url);
  console.log("🔗 Cleaned URL:", cleanUrl);

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    timeout: 45000, // Increase timeout
  };

  try {
    // Add random delay to avoid rate limiting
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    console.log(`⏱️ Adding ${Math.round(delay)}ms delay...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log("🚀 Starting Amazon scrape for:", cleanUrl);
    const response = await axios.get(cleanUrl, options);
    console.log("✅ Successfully fetched page, status:", response.status);
    console.log("📄 Response size:", response.data.length, "bytes");

    // Check if we're getting blocked
    if (
      response.data.includes("Robot Check") ||
      response.data.includes("To discuss automated access") ||
      response.data.includes("Enter the characters you see below") ||
      response.data.includes(
        "Sorry, we just need to make sure you're not a robot"
      ) ||
      response.data.length < 10000 // Amazon product pages are usually much larger
    ) {
      console.log("🤖 Bot detection triggered - response content preview:");
      console.log(response.data.substring(0, 300));
      throw new Error(
        "🤖 Amazon detected bot activity - requests are being blocked"
      );
    }

    const $ = cheerio.load(response.data);

    // Check what we actually got
    console.log("🏷️ Page title:", $("title").text().trim());
    console.log("🔍 #productTitle exists:", $("#productTitle").length > 0);
    console.log("🔍 .a-price elements found:", $(".a-price").length);

    const title = $("#productTitle").text().trim();
    console.log(
      "📝 Title extracted:",
      title ? "✅ " + title.substring(0, 50) + "..." : "❌ No title found"
    );

    // Extract current price with better targeting
    console.log("🔍 Extracting current price...");
    const currentPrice = extractPrice(
      $(".priceToPay .a-price-whole").first(), // Most specific for current price
      $(".a-price-whole").first(), // Take only first match
      $(".a-size-base.a-color-price").first(),
      $(".a-button-selected .a-color-base").first(),
      $(".a-price .a-offscreen").first() // Take only first match
    );
    console.log(
      "💰 Current price extracted:",
      currentPrice ? "✅ " + currentPrice : "❌ No current price found"
    );

    // Extract original/MRP price with better targeting
    console.log("🔍 Extracting original price...");
    const originalPrice = extractPrice(
      $(".a-price.a-text-price .a-offscreen").first(), // MRP price selector
      $("#listPrice").first(),
      $(".a-text-strike").first(), // Strikethrough price
      $("#priceblock_ourprice").first(),
      $("#priceblock_dealprice").first()
    );
    console.log(
      "💸 Original price extracted:",
      originalPrice ? "✅ " + originalPrice : "❌ No original price found"
    );

    // Debug: If no prices found, let's check what price elements exist
    if (!currentPrice && !originalPrice) {
      console.log("🔍 Debugging price elements:");
      console.log("- .a-price elements found:", $(".a-price").length);
      console.log(
        "- First .a-price text:",
        $(".a-price").first().text().trim()
      );
      console.log("- .a-price-whole elements:", $(".a-price-whole").length);
      console.log(
        "- First .a-price-whole text:",
        $(".a-price-whole").first().text().trim()
      );
      console.log(
        "- #priceblock_ourprice:",
        $("#priceblock_ourprice").text().trim()
      );

      // Check for alternative price selectors with their actual text
      console.log(
        "- .a-price .a-offscreen:",
        $(".a-price .a-offscreen").first().text().trim()
      );
      console.log(
        "- .a-price.a-text-price .a-offscreen (MRP):",
        $(".a-price.a-text-price .a-offscreen").first().text().trim()
      );
      console.log(
        "- .a-text-strike (crossed price):",
        $(".a-text-strike").first().text().trim()
      );
      console.log(
        "- [data-asin-price]:",
        $("[data-asin-price]").first().text().trim()
      );
      console.log(
        "- .a-price-range:",
        $(".a-price-range").first().text().trim()
      );
      console.log("- .priceToPay:", $(".priceToPay").first().text().trim());
      console.log(
        "- .a-price-symbol + .a-price-whole:",
        $(".a-price-symbol").first().text().trim() +
          $(".a-price-whole").first().text().trim()
      );

      // Show first few individual .a-price elements
      console.log("- Individual .a-price elements:");
      $(".a-price")
        .slice(0, 5)
        .each((i, el) => {
          console.log(`  [${i}]:`, $(el).text().trim());
        });
    }

    const outOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    let imageUrls: string[] = [];
    try {
      imageUrls = Object.keys(JSON.parse(images));
      console.log(
        "🖼️ Images extracted:",
        imageUrls.length > 0
          ? "✅ " + imageUrls.length + " images"
          : "❌ No images found"
      );
    } catch (e) {
      console.log("⚠️ Image parsing failed, trying fallback...");
      // Fallback to direct image src
      const fallbackImage =
        $("#landingImage").attr("src") ||
        $(".a-dynamic-image").first().attr("src");
      if (fallbackImage) {
        imageUrls = [fallbackImage];
        console.log("🖼️ Fallback image found:", "✅");
      } else {
        console.log("🖼️ No fallback image found:", "❌");
      }
    }

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description = extractDescription($);

    const category =
      $("#wayfinding-breadcrumbs_container")
        .find(".a-link-normal")
        .last()
        .text()
        .trim() ||
      $(".nav-a-content img").attr("alt") ||
      $(".nav-categ-image").attr("alt") ||
      $(".nav-a-content").first().text().trim() ||
      $("#nav-subnav").find(".nav-a-content").first().text().trim() ||
      $(".a-subheader").first().text().trim() ||
      "category";

    // Enhanced reviews extraction
    const reviewsCount =
      $("#acrCustomerReviewText")
        .text()
        .replace(/[^0-9]/g, "") ||
      $("[data-automation-id='reviews-block'] span")
        .text()
        .replace(/[^0-9]/g, "") ||
      0;

    // Enhanced ratings extraction
    const stars =
      parseFloat(
        $("#averageCustomerReviews .a-icon-star")
          .text()
          .replace(/[^0-9.]/g, "")
      ) ||
      parseFloat(
        $("[data-automation-id='reviews-block'] .a-icon-star")
          .text()
          .replace(/[^0-9.]/g, "")
      ) ||
      0;

    const fullurl = await getGoogleresult(title || "Product");
    const parts = fullurl?.split("/") || [];
    const geturl = parts.length > 4 ? parts.slice(4).join("/") : "";

    const rawDescription = extractDescription($);
    const cleanDescription = rawDescription
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const data = {
      url,
      geturl,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: category,
      reviewsCount: Number(reviewsCount),
      stars: stars,
      isOutOfStock: outOfStock,
      description: cleanDescription,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    console.log(data);

    return data;
  } catch (error: any) {
    console.error("❌ Amazon scraping failed:");
    console.error("Error status:", error.response?.status);
    console.error("Error message:", error.message);
    console.error("Error details:", error.response?.data?.substring(0, 200));

    if (error.response?.status === 503) {
      throw new Error(
        `Amazon blocked the request (503). Try again later or check your proxy configuration.`
      );
    } else if (error.response?.status === 500) {
      throw new Error(
        `Amazon server error (500). The URL might be invalid or temporarily unavailable.`
      );
    } else if (error.code === "ECONNREFUSED") {
      throw new Error(`Connection refused. Check your proxy configuration.`);
    } else {
      throw new Error(`Error in fetching product: ${error.message}`);
    }
  }
}

export async function googleProductSave(ProductGoogle: Product) {
  console.log(ProductGoogle, "product google");
  try {
    connectToDB();
    const fullurl = await getGoogleresult(ProductGoogle.title);
    const parts = fullurl.split("/");
    const geturl = parts.slice(4).join("/");
    console.log(geturl);

    const data = {
      url: ProductGoogle.product_link,
      geturl,
      currency: "₹",
      image: ProductGoogle.thumbnail,
      title: ProductGoogle.title,
      currentPrice: ProductGoogle.extracted_price,
      originalPrice: ProductGoogle.extracted_price,
      priceHistory: [],
      discountRate: ProductGoogle.extracted_price + 1000,
      category: "Tech",
      reviewsCount: ProductGoogle.reviews,
      stars: ProductGoogle.rating,
      isOutOfStock: false,
      description: ProductGoogle.title,
      lowestPrice: ProductGoogle.extracted_price - 1000,
      highestPrice: ProductGoogle.extracted_price + 1000,
      averagePrice: ProductGoogle.extracted_price,
    };

    let product = data;

    const existingProduct = await Product.findOne({ url: product.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: product.currentPrice },
      ];

      product = {
        ...product,
        priceHistory: updatedPriceHistory,
        lowestPrice: ProductGoogle.extracted_price,
        highestPrice: ProductGoogle.extracted_price,
        averagePrice: ProductGoogle.extracted_price,
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: product.url },
      product,
      { upsert: true, new: true }
    );
    const redirectUrl = newProduct._id.toString();
    revalidatePath(`/products/${redirectUrl}`);
    revalidatePath("/", "layout");
    console.log(redirectUrl);
    return redirectUrl;

    // Handle the response data as needed
  } catch (error) {
    console.error("Error occurred while fetching data:", error);
  }
}
export async function googleShoppingResult(title: string) {
  const ip = headers().get("x-forwarded-for");
  console.log(ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip!
  );
  console.log(success, pending, limit, reset, remaining);

  if (!success) {
    // Router.push("/blocked");
    return { error: "bhai ab try mt kr" };
  }

  try {
    const json = await getJson({
      engine: "google_shopping",
      q: `${title}`,
      location: "India",
      hl: "en",
      gl: "in",
      api_key: process.env.API_KEY,
      num: 30,
    });

    //  console.log(json["shopping_results"])
    // console.log(json);
    //  console.log(json["related_shopping_results"]);
    // console.log(json["related_searches"]);
    return json["shopping_results"];
  } catch (error) {
    console.error("Error occurred while scraping:", error);
  }
}

export async function getGoogleresult(title: string) {
  const ip = headers().get("x-forwarded-for");
  console.log(ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip!
  );
  console.log(success, pending, limit, reset, remaining);

  if (!success) {
    // Router.push("/blocked");
    return { error: "bhai ab try mt kr" };
  }

  try {
    console.log(title);

    const titleWords = title.split(" ");
    let query = titleWords.slice(0, 7).join(" ");

    query = query.replace(/[,|]/g, "");

    query = query.replace(/\s+/g, "-");

    console.log(query);
    const searchTerm = `${encodeURIComponent(
      query
    )}%20site:pricehistoryapp.com`;
    console.log("here");
    console.log(searchTerm);
    const result = await getJson("google", {
      api_key: process.env["API_KEY"],
      q: searchTerm,
    });
    console.log(result.organic_results);
    const jsonresult = result.organic_results;
    const urlproduct = jsonresult[0].link;
    console.log(urlproduct);

    return urlproduct;
  } catch (error: any) {
    throw new Error(`error in fetching product ${error.message}`);
  }
}
