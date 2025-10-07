import { Fragment } from "react";
import { ImgSlider } from "../components/ImgSlider";
import { PgHeader } from "../components/PgHeader";
export default function Home() {
  return (
    <Fragment>
      <PgHeader />
      <ImgSlider />
    </Fragment>
  );
}
