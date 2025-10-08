import { Fragment } from "react";
// import { ImgSlider } from "../components/ImgSlider";
import { PgHeader } from "../components/PgHeader";
import Carousel from "../components/Carousel";
export default function Home() {
  return (
    <Fragment>
      <div className="h-screen flex flex-col overflow-hidden">

        <PgHeader />

        <main
          className="flex-1 overflow-hidden"
          style={{
            paddingTop: `0px`,
            paddingBottom: `40px`,
          }}
        >
          <Carousel />
        </main>
      </div>
      {/* <ImgSlider /> */}
      <footer className="fixed bottom-0 left-0 w-full h-[40px] bg-teal-900 text-white flex items-center justify-center text-xs shadow-inner z-10">
        Copyright &copy; {new Date().getFullYear()} Al Baitar SoftVet
      </footer>
    </Fragment>
  );
}
