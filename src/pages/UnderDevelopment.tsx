import { useNavigate } from "react-router-dom";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";

const ConstructionIcon = () => (
  <svg
    width="80px"
    height="80px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mb-4 text-yellow-500"
  >
    <path
      d="M16 4.00001L18 6.00001L17 7.00001L15 5.00001L16 4.00001Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 13L19.2929 11.7071C19.6834 11.3166 19.6834 10.6834 19.2929 10.2929L13.7071 4.70711C13.3166 4.31658 12.6834 4.31658 12.2929 4.70711L11 6.00001"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 8.00001L16 15L18 13L11 6.00001L9 8.00001Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 21H8L18 11L13 6.00001L3 16V21H2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 21L12 16L14 18L9 23H7V21Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function UnderDevelopment() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full bg-gray-50">
        <div className="flex flex-col justify-center items-center text-center p-8 border border-yellow-300 rounded-lg bg-yellow-50 shadow-md max-w-lg mx-4">
          <ConstructionIcon />
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">
            Page en cours de développement
          </h1>
          <p className="text-gray-700 mb-6">
            Cette fonctionnalité est en cours de construction. Veuillez revenir
            plus tard.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:underline font-semibold border border-blue-600 hover:bg-blue-600 hover:text-white py-2 px-4 rounded-xl"
          >
            Retour
          </button>
        </div>
      </div>
      <PgFooter />
    </div>
  );
}
