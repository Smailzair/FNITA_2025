import { Fragment } from "react";
// import { ImgSlider } from "../components/ImgSlider";
import { PgHeader } from "../components/PgHeader";
import Carousel from "../components/Carousel";
import PgFooter from "../components/PgFooter";
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
      <PgFooter />
    </Fragment>
  );
}
