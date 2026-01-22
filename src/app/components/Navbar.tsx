// import Image from 'next/image'
// import Link from 'next/link'
// import React from 'react'

// const navIcons = [
//     { src: '/assets/icons/search.svg', alt: 'search' },
//     { src: '/assets/icons/black-heart.svg', alt: 'heart' },
//     { src: '/assets/icons/user.svg', alt: 'user' },
//   ]
//  export default function  Navbar () {
//   return (    <header className="w-full">
//   <nav className="flex justify-between items-center px-6 md:px-20 py-4">
//     <Link href="/" className="flex items-center gap-1">
//       <Image
//         src="/assets/icons/logo.svg"
//         width={27}
//         height={27}
//         alt="logo"
//       />

//       <p className="text-[21px] text-secondary font-bold">
//         WatchThe<span className='text-primary'>Drop</span>
//       </p>
//     </Link>

//     <div className="flex items-center gap-5">
//       {navIcons.map((icon) => (
//         <Image
//           key={icon.alt}
//           src={icon.src}
//           alt={icon.alt}
//           width={28}
//           height={28}
//           className="object-contain"
//         />
//       ))}
//     </div>
//   </nav>
// </header>
// )
//  }
"use client";
import Image from "next/image";
import Link from "next/link";
import { WobbleButton } from "./WobbleButton";
import { motion } from "framer-motion";
import { DURATION, Delay } from "./constants";
import { useMediaQuery } from "react-responsive";

interface NavItem {
  id: string;
  title: string;
  href: string;
}
export const Navbar = () => {
  const isSmallDevice = useMediaQuery({ maxWidth: 768 });
  const navItems: NavItem[] = [
    {
      id: "1",
      title: "products",
      href: "#home",
    },
  ];
  return (
    <nav className="fixed drop-shadow-lg w-full z-20 mt-2 lg:mt-8 px-4">
      <motion.div
        className="w-fit max-w-full p-2 sm:p-3 bg-white rounded-full flex justify-between items-center gap-2 sm:gap-12 mx-auto"
        initial={{
          rotateX: 120,
          opacity: 0,
        }}
        animate={{
          rotateX: 0,
          opacity: 1,
          transition: {
            duration: DURATION,
            delay: Delay.NAVBAR,
            type: "ease-out",
          },
        }}
      >
        <Link
          href="/"
          className="flex pr-4 sm:pr-0 text-gray-900 pl-2 sm:pl-3 items-center"
        >
          <span className="font-bold text-lg sm:text-2xl">WatchTheDrop</span>
        </Link>
        <ul className=" hidden sm:flex gap-2">
          {navItems.map((item, index) => {
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className=" hover:text-[#8330C2] duration-200 ease-in"
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
        {isSmallDevice ? (
          <Link href="#explore" className=" rounded-full">
            <WobbleButton
              title="Explore"
              textStyle={{ fontSize: "1rem" }}
              type="sm"
            />
          </Link>
        ) : (
          <Link href="#explore" className=" rounded-full">
            <WobbleButton
              title="Explore"
              textStyle={{ fontSize: "1rem" }}
              type="md"
            />
          </Link>
        )}
      </motion.div>
    </nav>
  );
};
