import { useState } from "react";
import { Link } from "react-router-dom";
import { MainDroll } from "./MainDroll";

export const PgHeader = () => {
  const [Drollmenue, Setdrollmenue] = useState(false);
  return (
    <nav className="bg-teal-900 z-0">
      <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
        <div className="relative flex h-20 items-center justify-between">
          <div
            className="flex grow items-center justify-center sm:justify-star"
            onMouseLeave={() => Setdrollmenue(false)}
          >
            <div className="items-center min-w-fit ml-1">
              <Link to={".."}>
                <img
                  src="/LOGO_ALG.png"
                  alt="LOGO_ALG"
                  width={360}
                  height={360}
                  className="h-16 w-16 min-w-full"
                />
              </Link>
            </div>
            <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
              <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
                République algérienne démocratique et populaire
                <br />
                Ministère de l&apos;Agriculture et du Développement Rural
                <br />
                Fichier National d&apos;Identification et Traçabilité Animale
              </p>
            </div>
            <div
              className="float-right"
              onMouseLeave={() => Setdrollmenue(false)}
            >
              {Drollmenue && <MainDroll />}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
