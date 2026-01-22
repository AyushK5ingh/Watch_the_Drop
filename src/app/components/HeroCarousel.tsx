"use client"

import "react-responsive-carousel/lib/styles/carousel.min.css"; 
// import { Carousel } from 'react-responsive-carousel';
import Image from "next/image";

const heroImages = [
  { imgUrl: '/assets/images/hero-1.svg', alt: 'smartwatch'},
  { imgUrl: '/assets/images/hero-2.svg', alt: 'bag'},
  { imgUrl: '/assets/images/hero-3.svg', alt: 'lamp'},
  { imgUrl: '/assets/images/hero-4.svg', alt: 'air fryer'},
  { imgUrl: '/assets/images/hero-5.svg', alt: 'chair'},
]

const HeroCarousel = () => {
  return (
    <div className="relative hidden sm:flex  max-w-[700px]  h-[600px] w-full bg-transparent rounded-[30px] ">
       {/* <Carousel
        showThumbs={false}
         autoPlay
        infiniteLoop
         interval={2000}
        showArrows={false}
        showStatus={false}
      >
        {heroImages.map((image) => (
          <Image 
            src={image.imgUrl}
            alt={image.alt}
            width={484}
            height={484}
            className="object-contain"
            key={image.alt}
          />
        ))}
      </Carousel> */}

      <Image 
        src="/assets/images/iphone.png"
        alt="arrow"
        width={1000}
        height={1000}
        className="w-full h-full"
      /> 
    </div>
  )
}

export default HeroCarousel