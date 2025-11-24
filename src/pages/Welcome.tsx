import { Fragment, type SVGProps, useState, useEffect } from "react";
// import { ImgSlider } from "../components/ImgSlider";
import { PgHeader } from "../components/PgHeader";
import Carousel from "../components/Carousel";
import PgFooter from "../components/PgFooter";
import { Link } from "react-router-dom";
import { authState } from "../api/auth-state";

const ActionButton = ({
  to,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  to: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className="group block w-full my-2 md:h-24 md:[perspective:1000px]"
  >
    {/* Mobile-first: simple layout */}
    <div className="flex items-center w-full h-full p-3 bg-white rounded-lg shadow-md border border-gray-200 md:hidden">
      <Icon className="h-10 w-10 text-cyan-600 mr-4 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="font-bold text-cyan-800 text-md">{title}</span>
        <span className="text-gray-600 text-sm">{subtitle}</span>
      </div>
    </div>

    {/* Desktop: 3D flip layout */}
    <div className="hidden md:block relative h-full w-full md:transition-transform md:duration-700 md:ease-in-out md:[transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)]">
      {/* Front Face */}
      <div className="absolute flex items-center w-full h-full p-3 bg-white rounded-lg shadow-md border border-gray-200 [backface-visibility:hidden]">
        <Icon className="h-10 w-10 text-cyan-600 mr-4 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="font-bold text-cyan-800 text-md">{title}</span>
        </div>
      </div>
      {/* Back Face */}
      <div className="hidden md:flex absolute items-center justify-center w-full h-full p-3 bg-cyan-700 border-1 border-white text-white rounded-lg shadow-lg [transform:rotateY(180deg)] [backface-visibility:hidden]">
        <p className="text-center text-sm px-2">{subtitle}</p>
      </div>
    </div>
  </Link>
);

// Placeholder Icons
const LostPetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </g>
  </svg>
);

const FoundPetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IdentifyPetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2M5 20H7a2 2 0 002-2V6a2 2 0 00-2-2H5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 4v16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const VetsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 12.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM18.5 22a6.5 6.5 0 00-13 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AyantDroitIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.91312 11.6739C3.23584 10.1953 3.53865 8.80805 2 6.5L5.5 2.5C5.5 2.5 9 4 12 1.5C15 4 18.5 2.5 18.5 2.5L22 6.5C20.4612 8.8081 20.7641 10.1954 21.0868 11.674C21.3933 13.0781 21.7177 14.5645 20.5 17C19.3425 19.315 17.3478 20.1227 15.4849 20.877C14.1289 21.4261 12.8428 21.9469 12.0003 23C11.1577 21.9469 9.8715 21.4261 8.51549 20.8771C6.65245 20.1227 4.65758 19.315 3.50001 17C2.28218 14.5645 2.60663 13.078 2.91312 11.6739ZM14.3776 12.7725L16.7552 10.4549L13.4694 9.97746L11.9999 7L10.5304 9.97746L7.24463 10.4549L9.62227 12.7725L9.06098 16.0451L11.9999 14.5L14.9388 16.0451L14.3776 12.7725Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const AdminIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M21.94 12.04c-.16-4.4-3.58-7.9-7.9-7.9-2.02 0-3.89.77-5.33 2.08"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.06 11.96c.16 4.4 3.58 7.9 7.9 7.9 2.02 0 3.89-.77 5.33-2.08"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // When the homepage loads, always reset the isLoggingOut flag.
    // This ensures that subsequent session expirations correctly redirect to /login.
    authState.isLoggingOut = false;
  }, []);

  return (
    <Fragment>
      <div className="h-screen flex flex-col overflow-hidden">
        <PgHeader />
        <main className="flex-1 overflow-hidden relative bg-gray-50 md:flex md:flex-row">
          <div className="w-full h-full relative md:flex-1">
            <Carousel />
            <div className="md:hidden absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-cyan-800 hover:bg-white"
              >
                <MenuIcon className="h-8 w-8" />
              </button>
            </div>
          </div>
          <aside
            className={`absolute top-0 right-0 h-full w-full flex flex-col items-center justify-start
              bg-gradient-to-r from-transparent to-gray-100/60 backdrop-blur-md z-10 overflow-y-auto p-4
              transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
              md:static md:w-1/4 md:translate-x-0 md:justify-center
              md:bg-none md:bg-emerald-900 md:backdrop-blur-none`}
          >
            <p className="font-ScienceGothic-Light text-2xl tracking-wider whitespace-nowrap text-center text-gray-50 max-sm:text-xs mb-10">
              [ F.N.I.T.A ]
            </p>
            <p className="font-ScienceGothic-ExtraLight text-xl  whitespace-nowrap text-center text-gray-50 max-sm:text-xs mb-10">
              Fichier National
              <br />
              d&apos;Identification
              <br />
              et Traçabilité Animale
            </p>
            <div className="w-full max-w-sm">
              <ActionButton
                to="/lost"
                icon={LostPetIcon}
                title="J'ai perdu mon animal"
                subtitle="Déclarez la perte de votre animal et partagez sa fiche sur les réseaux sociaux."
              />
              <ActionButton
                to="/found"
                icon={FoundPetIcon}
                title="J'ai trouvé un animal"
                subtitle="Vous avez trouvé un animal ? Déclarez-le pour aider son propriétaire à le retrouver."
              />
              <ActionButton
                to="/identify"
                icon={IdentifyPetIcon}
                title="Je fais identifier mon animal"
                subtitle="L'identification est une étape clé de la protection animale. C'est un acte qui prouve la propriété de votre animal."
              />

              <hr className="my-4 border-white/40" />

              <ActionButton
                to="/aydroitdashboard"
                icon={AyantDroitIcon}
                title="Espace Ayant-Droit"
                subtitle="Accès réservé aux forces de l'ordre, fourrières, et autres entités autorisées."
              />
              <ActionButton
                to="/vetsdashboard"
                icon={VetsIcon}
                title="Espace Vétérinaire"
                subtitle="Accès réservé aux vétérinaires pour la gestion des identifications et des dossiers médicaux."
              />
              <ActionButton
                to="/admindashboard"
                icon={AdminIcon}
                title="Espace Administrateur"
                subtitle="Accès réservé aux administrateurs du Fichier National d'Identification."
              />
            </div>
          </aside>
        </main>
        <PgFooter />
      </div>
    </Fragment>
  );
}
