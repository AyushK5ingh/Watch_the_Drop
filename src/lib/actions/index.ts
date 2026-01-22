"use server"
import {  scrapeAmazonProducts} from "../scrape";
import { connectToDB } from "../mongoose";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utlis";
import Product from "@/models/product.model";
import { revalidatePath } from "next/cache";
import { generateEmailBody, sendEmail } from "../nodemailer";
import { User } from "@/types";
import { redis } from "../../app/config/ratelimit";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";


const ratelimit = new Ratelimit({ 
  redis: redis, 
  limiter: Ratelimit.fixedWindow(3, '60s'), 
});
export async function scrapeAndStoreProducts(producturl: string) {

  if (!producturl) return null;
  try {
      connectToDB();
      // const scrapedProduct = await scrapeAmazonProducts(producturl);
      const url = new URL(producturl);
        const hostname = url.hostname;

        let scrapedProduct;

        if (hostname.includes('amazon.com') || hostname.includes('amazon.') || hostname.endsWith('amazon')) {
            console.log("amazon")
            scrapedProduct = await scrapeAmazonProducts(producturl);
        } else if (hostname.includes('flipkart.com') || hostname.includes('flipkart.') || hostname.endsWith('flipkart')) {
          console.log("flipkart")
          return null;
        } else {
            // Handle unsupported URLs or other cases
            return null;
        }

      if (!scrapedProduct) return null;

      let product = scrapedProduct;

      const existingProduct = await Product.findOne({ url: scrapedProduct.url });

      if (existingProduct) {
          const updatedPriceHistory: any = [
              ...existingProduct.priceHistory,
              { price: scrapedProduct.currentPrice }
          ];

          product = {
              ...scrapedProduct,
              priceHistory: updatedPriceHistory,
              lowestPrice: getLowestPrice(updatedPriceHistory),
              highestPrice: getHighestPrice(updatedPriceHistory),
              averagePrice: getAveragePrice(updatedPriceHistory),
          };
      }

      const newProduct = await Product.findOneAndUpdate(
          { url: scrapedProduct.url },
          product,
          { upsert: true, new: true }
      );
      const redirectUrl = newProduct._id.toString();
      revalidatePath(`/products/${redirectUrl}`);
      revalidatePath("/", "layout");

      return { redirectUrl }; 
  } catch (error: any) {
      throw new Error(`Failed to create/update product: ${error.message}`);
  }
}


export async function getProductById(productId: string) {
  try {
    connectToDB();

    const product = await Product.findOne({ _id: productId });

    if(!product) return null;

    return product;
  } catch (error:any) {
    throw new Error(`Failed to create/update product: ${error.message}`)
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    connectToDB();
     const products = await Product.find();
     return products
  } catch (error:any) {
    throw new Error(`Failed to create/update product: ${error.message}`)
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    // const currentProduct = await Product.findById(productId);

    // if(!currentProduct) return null;

    // const similarProducts = await Product.find({
    //   _id: { $ne: productId },
    // }).limit(6);

    // return similarProducts;
    const randomProducts = await Product.aggregate([
      { 
        $match: { _id: { $ne: new Object(productId) } } 
      },
      { 
        $sample: { size: 20 } 
      }
    ]);

    return randomProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
   const ip = headers().get("x-forwarded-for") ;
console.log(ip);
const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip!);
console.log(success, pending, limit, reset, remaining);

if (!success) {
  // Router.push("/blocked");
  return {error: "bhai ab try mt kr"};
}
  try {
    const product = await Product.findById(productId);

    if(!product) return;

    const userExists = product.users.some((user: User) => user.email === userEmail);

    if(!userExists) {
      product.users.push({ email: userEmail });

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");

      await sendEmail(emailContent, [userEmail]);
    }
  } catch (error) {
    console.log(error);
  }
}