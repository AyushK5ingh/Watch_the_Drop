import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  return (
    <Link
      href={`/products/${product._id}`}
      className="flex flex-col items-center group transition-transform duration-200 ease-in-out px-2 py-8"
      style={{ minHeight: 340 }}
    >
      <div className="relative flex flex-col items-center w-full">
        <Image
          src={product.image}
          alt={product.title}
          width={260}
          height={260}
          className="object-contain w-full h-[200px] transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col items-center gap-2 mt-6 w-full">
        <h3 className="text-gray-900 text-lg font-semibold font-sans text-center truncate w-full">
          {product.title}
        </h3>
        <p className="text-primary text-xl font-bold text-center">
          <span>{product?.currency}</span>
          <span>{product?.currentPrice}</span>
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
