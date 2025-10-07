import { Fragment } from "react";
// import { ImgSlider } from "../components/ImgSlider";
import { PgHeader } from "../components/PgHeader";
import Carousel from "../components/Carousel";
export default function Home() {
  return (
    <Fragment>
      <div
        className="relative min-h-screen bg-gray-900 text-white"
        style={{
          paddingTop: `0px`,
          paddingBottom: `0px`,
        }}
      >
        <div className="top-0 z-50">
          <PgHeader />
        </div>

        <main className="flex items-center justify-center w-full h-[calc(100vh-112px)]">
          <Carousel />
        </main>
      </div>
      {/* <ImgSlider /> */}
    </Fragment>
  );
}
