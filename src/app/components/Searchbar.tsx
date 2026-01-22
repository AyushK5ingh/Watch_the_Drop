"use client";
import { useRouter } from "next/navigation";
import { scrapeAndStoreProducts } from "@/lib/actions";
// import { scrapeAndStoreProduct } from '@/lib/actions';
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const detectPlatform = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    if (
      hostname.includes("amazon.com") ||
      hostname.includes("amazon.") ||
      hostname.endsWith("amazon")
    ) {
      return "amazon";
    }

    if (
      hostname.includes("flipkart.com") ||
      hostname.includes("flipkart.") ||
      hostname.endsWith("flipkart")
    ) {
      return "flipkart";
    }

    return null;
  } catch (error) {
    return null;
  }
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const platform = detectPlatform(searchPrompt);

    // If it's not a valid URL, search for product name
    if (!platform) {
      router.push(`/shopping/${searchPrompt}`);
      return;
    }

    // Show minimal popup for Flipkart links
    if (platform === "flipkart") {
      toast.error(
        "📦 Please use Amazon links or search by product name instead",
        {
          position: "top-center",
          duration: 3000,
          style: {
            fontSize: "14px",
            padding: "12px 16px",
          },
        }
      );
      return;
    }

    // Process Amazon links
    if (platform === "amazon") {
      try {
        setIsLoading(true);

        const promise = () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ name: "Product" }), 2000)
          );
        toast.promise(promise, {
          loading: "Analyzing product... takes upto 15sec",
          position: "top-center",
          success: () => "Redirecting to product page",
          error: "Failed to analyze product",
        });

        const product = await scrapeAndStoreProducts(searchPrompt);
        if (product && product.redirectUrl) {
          router.push(`/products/${product.redirectUrl}`);
        } else {
          toast.error("❌ Product not found or unavailable", {
            position: "top-center",
          });
        }
      } catch (error) {
        console.log(error);
        toast.error("❌ Failed to process product. Please try again.", {
          position: "top-center",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form className="flex px-4 flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter product name or link"
        className="flex-1 min-w-[200px] w-full p-3 pl-5 border border-gray-300 rounded-3xl shadow-xs text-base text-gray-500 focus:outline-none"
      />

      <button
        type="submit"
        className="bg-[#5a259f]  rounded-3xl shadow-xs px-6 py-3 text-white text-base font-semibold hover:opacity-90 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
        disabled={searchPrompt === ""}
      >
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
};

export default Searchbar;
