"use client";
import { Zoom } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";

export const ImgSlider = () => {
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

  return (
    <div className="slide-container">
      <Zoom scale={1.1} duration={1500} pauseOnHover={false}>
        {images.map((each, index) => (
          <div
            key={index}
            className="flex justify-center items-center h-[calc(100vh-7.25rem)]"
          >
            <img
              // className="flex justify-center items-center h-[calc(100vh-7.25rem)] min-w-fit"
              className="flex justify-center items-center min-w-fit"
              // key={index}
              alt=""
              src={each}
            />
          </div>
        ))}
      </Zoom>
    </div>
  );
};
