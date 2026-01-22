import Modal from "@/app/components/Modal";
import { getProductById, getSimilarProducts } from "@/lib/actions";
import PriceInfoCard from "@/app/components/PriceInfoCard";
import ProductCard from "@/app/components/ProductCard";
import { formatNumber, getEnhancedPriceData } from "@/lib/utlis";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster, toast } from "sonner";
import { TruncatedDescription } from "@/app/components/description";

type Props = {
  params: { id: string };
};

const ProductDetails = async ({ params: { id } }: Props) => {
  const product: Product = await getProductById(id);

  if (!product) redirect("/");

  const similarProducts = await getSimilarProducts(id);

  // 🚀 Get enhanced price data from PriceHistoryApp using the stored slug
  const enhancedPriceData = await getEnhancedPriceData(product.geturl);

  return (
    <div className="flex  flex-col gap-16 flex-wrap px-6 md:px-20 py-32">
      <div className="flex gap-28 xl:flex-row flex-col">
        <div className="flex-grow xl:max-w-[50%] max-w-full py-16  rounded-[17px]">
          <Image
            src={product.image}
            alt={product.title}
            width={580}
            height={400}
            className="mx-auto"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
            <div className="flex flex-col gap-3">
              <p className="text-[28px] text-secondary font-semibold">
                {product.title}
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href={product.url}
                  target="_blank"
                  className="text-base text-black opacity-90"
                >
                  Visit Product
                </Link>
                {enhancedPriceData?.priceFetchedAt && (
                  <span className="text-sm text-gray-500">
                    Price updated:{" "}
                    {new Date(
                      enhancedPriceData.priceFetchedAt
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FFF0F0] rounded-10">
                <Image
                  src="/assets/icons/red-heart.svg"
                  alt="heart"
                  width={20}
                  height={20}
                />

                <p className="text-base font-semibold text-[#D46F77]">
                  {product.reviewsCount}
                </p>
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/bookmark.svg"
                  alt="bookmark"
                  width={20}
                  height={20}
                />
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                />
              </div>

              {enhancedPriceData?.category && (
                <span className="text-sm text-gray-500 ml-2">
                  category: {enhancedPriceData.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-10 py-6 border-y border-y-[#E4E4E4]">
            <div className="flex flex-col gap-2">
              <p className="text-[34px] text-secondary font-bold">
                {product.currency}{" "}
                {formatNumber(
                  enhancedPriceData?.currentPrice || product.currentPrice
                )}
              </p>
              <p className="text-[21px] text-black opacity-50 line-through">
                {product.currency}{" "}
                {formatNumber(
                  enhancedPriceData?.highestPrice || product.highestPrice
                )}
              </p>
              {enhancedPriceData?.discount && (
                <p className="text-green-600 font-semibold">
                  {enhancedPriceData.discount.toFixed(1)}% OFF
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#FBF3EA] rounded-[27px]">
                  <Image
                    src="/assets/icons/star.svg"
                    alt="star"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-primary-orange font-semibold">
                    {product.stars || "25"}
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-white-200 rounded-[27px]">
                  <Image
                    src="/assets/icons/comment.svg"
                    alt="comment"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-secondary font-semibold">
                    {product.reviewsCount} Reviews
                  </p>
                </div>
              </div>

              {enhancedPriceData?.dropChances && (
                <p className="text-sm text-gray-600">
                  📈{" "}
                  <span className="font-medium">
                    {enhancedPriceData.dropChances}%
                  </span>{" "}
                  chance of price drop
                </p>
              )}
            </div>
          </div>

          <div className="my-7 flex flex-col gap-5">
            <div className="flex gap-5 flex-wrap">
              <PriceInfoCard
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(
                  enhancedPriceData?.currentPrice || product.currentPrice
                )}`}
              />
              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(
                  enhancedPriceData?.averagePrice || product.averagePrice
                )}`}
              />
              <PriceInfoCard
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(
                  enhancedPriceData?.highestPrice || product.highestPrice
                )}`}
              />
              <PriceInfoCard
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(
                  enhancedPriceData?.lowestPrice || product.lowestPrice
                )}`}
              />
            </div>

            {/* 🚀 Enhanced price insights */}
            {enhancedPriceData && (
              <div className="flex flex-col gap-4 mt-4">
                {/* Buying Recommendation - Most Important */}
                <div className="p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    💡 Buying Recommendation
                  </h4>
                  <p
                    className={`font-medium ${
                      enhancedPriceData.recommendationType === "excellent"
                        ? "text-green-700"
                        : enhancedPriceData.recommendationType === "good"
                        ? "text-green-600"
                        : enhancedPriceData.recommendationType === "decent"
                        ? "text-yellow-600"
                        : enhancedPriceData.recommendationType === "moderate"
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {enhancedPriceData.buyingRecommendation}
                  </p>
                </div>

                {/* Other insights */}
                <div className="flex gap-5 flex-wrap">
                  {/* Show if it's close to lowest price */}
                  {enhancedPriceData.currentPrice <=
                    enhancedPriceData.lowestPrice * 1.1 && (
                    <div className="bg-lime-100 px-4 py-2 rounded-lg">
                      <p className="text-lime-800 font-semibold">
                        🎯 Near lowest price ever!
                      </p>
                    </div>
                  )}
                </div>

                {/* Smart Insights Section */}
                <div className="p-4 pt-0 rounded-lg">
                  <h5 className="font-semibold text-gray-800 mb-3">
                    🧠 Smart Insights
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Savings Potential:
                        </span>{" "}
                        You could save up to{" "}
                        <span className="text-green-600 font-semibold">
                          ₹
                          {formatNumber(
                            enhancedPriceData.highestPrice -
                              enhancedPriceData.lowestPrice
                          )}
                        </span>{" "}
                        by buying at the right time
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Current vs Average:
                        </span>{" "}
                        Price is{" "}
                        {enhancedPriceData.currentPrice <
                        enhancedPriceData.averagePrice ? (
                          <span className="text-green-600 font-semibold">
                            ₹
                            {formatNumber(
                              enhancedPriceData.averagePrice -
                                enhancedPriceData.currentPrice
                            )}{" "}
                            below
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">
                            ₹
                            {formatNumber(
                              enhancedPriceData.currentPrice -
                                enhancedPriceData.averagePrice
                            )}{" "}
                            above
                          </span>
                        )}{" "}
                        average
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Modal productId={id} />
        </div>
      </div>

      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-5">
          <h3 className="text-2xl text-secondary font-semibold">
            Product Description
          </h3>

          <div className="flex flex-col gap-4">
            <TruncatedDescription description={product?.description || ""} />
          </div>
        </div>

          <Link
           href={product.url}
           target="_blank"
           className="text-base text-white"
         >
        <button className="py-4 px-4 bg-black hover:bg-opacity-70 rounded-[30px] text-white text-lg font-semibold w-fit mx-auto flex items-center justify-center gap-3 min-w-[200px]">
          <Image
            src="/assets/icons/bag.svg"
            alt="check"
            width={22}
            height={22}
          />
            Buy Now
        </button>
          </Link>
      </div>
      {product.geturl ? ( // Check if graphUrl is not null and has a value
        <div // Render a <div> element
          dangerouslySetInnerHTML={{
            // Set the inner HTML of the <div> element
            __html: `<iframe id="price_frame" src="https://pricehistoryapp.com/embed/${
              // Define the HTML content as a string with embedded JavaScript variables
              product.geturl // Extract the graph ID from the graphUrl
            }" width="100%" height="500" frameborder="0" allowtransparency="true" scrolling="no"></iframe><script>const allLinks=document.querySelectorAll('a')  ; // Start of JavaScript code block
allLinks.forEach(ele=>{ // Loop through all links found on the page
  if(ele.href=='https://pricehistoryapp.com/?ref=embed'){ // Check if the link is the one to be hidden
    ele.style.display='none' // Hide the link by setting its display style to 'none'
  }
})</script>`, // End of HTML content and JavaScript code block
          }}
        />
      ) : null}
      {similarProducts && similarProducts?.length > 0 && (
        <div className="py-14 flex flex-col gap-2 w-full">
          <p className="text-secondary text-[32px] font-semibold">
            More Products
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-24 py-8 mt-7 w-full">
            {similarProducts?.reverse().map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
