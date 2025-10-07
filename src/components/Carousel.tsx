import { useState, useEffect } from "react";

const images = [
  "/MainFrmSlider/001.jpg",
  "/MainFrmSlider/002.jpg",
  "/MainFrmSlider/003.jpg",
  "/MainFrmSlider/004.jpg",
  "/MainFrmSlider/005.jpg",
  "/MainFrmSlider/007.jpg",
  "/MainFrmSlider/008.jpg",
  "/MainFrmSlider/009.jpg",
  "/MainFrmSlider/010.jpg",
  "/MainFrmSlider/011.jpg",
  "/MainFrmSlider/012.jpg",
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [current]);

  const nextSlide = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 flex items-center justify-center bg-black"
          >
            <img
              src={src}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
      >
        ❮
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
      >
        ❯
      </button>

      {/* Dots */}
      {/* Dots (minimal lines) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-[1px] w-[20px] transition-all ${
              index === current
                ? "bg-white opacity-90"
                : "bg-white/30 opacity-60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
