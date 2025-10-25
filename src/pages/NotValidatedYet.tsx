import { useLocation, Link } from "react-router-dom";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";

export default function NotValidatedYet() {
  const location = useLocation();

  // Safely access state with optional chaining and provide default values
  const { fam_nme, nme, email } = location.state || {
    fam_nme: "Utilisateur",
    nme: "",
    email: "votre email",
  };

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full bg-gray-50">
        <div className="flex flex-col justify-center items-center text-center p-8 border border-blue-200 rounded-lg bg-blue-50 shadow-md max-w-lg mx-4">
          <svg
            width="70px"
            height="70px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4 text-blue-500"
          >
            <path
              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 7V12L15 13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="text-xl font-bold text-blue-800 text-center items-center w-fit mb-4">
            Compte en attente de validation
          </h1>
          <p className="text-gray-700 mb-4">
            Bonjour {fam_nme} {nme}, votre compte associé à l'email ({email}) a bien été créé et votre email est confirmé. <br /> <br /> Cependant, les administrateurs doivent encore valider votre profil. Veuillez réessayer de vous connecter plus tard.
          </p>
          <p className="text-lime-600 mb-6">
            (Vous recevrez un email de confirmation lorsque votre compte sera validé.)
          </p>
          <Link to="/login" className="text-blue-600 hover:underline font-semibold border border-blue-600 hover:bg-blue-600 hover:text-white py-2 px-4 rounded-xl">Retour à la page de connexion</Link>
        </div>
      </div>
      <PgFooter />
    </div>
  );
}