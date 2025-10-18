// pages/email_confirm.tsx or app/email_confirm/page.tsx

import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";

type Status = "loading" | "success" | "error";

export default function EmailConfirm() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Vérification de votre compte...");

  // Use useEffect to run the verification logic once the component mounts
  useEffect(() => {
    // 1. Get query parameters from the URL

    // 1. On load, only EXTRACT and STORE the token data.
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || type !== "signup") {
      setStatus("error");
      setMessage("Lien de confirmation manquant ou invalide.");
      return;
    }

    setStatus("loading");
    setMessage("Confirmation en cours...");

    // run async verification inside the effect
    (async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "signup" as const,
      });

      if (error) {
        setStatus("error");
        setMessage(
          `La vérification a échoué. Le lien a peut-être expiré ou a déjà été utilisé.`
        );
        console.error("Confirmation Error:", error);
      } else if (data && typeof data === "object" && "user" in data) {
        setStatus("success");
        setMessage(`Votre compte est maintenant confirmé !`);
      } else {
        setStatus("error");
        setMessage("Une erreur inattendue est survenue.");
      }
    })();
  }, []);
  // --- Render Functions ---

  const renderSuccess = () => (
    <div className="flex flex-col justify-center items-center text-center p-8 border border-green-200 rounded-lg bg-green-50">
      <svg
        width="70px"
        height="70px"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M512 64l100.266667 76.8 123.733333-17.066667 46.933333 117.333334 117.333334 46.933333-17.066667 123.733333L960 512l-76.8 100.266667 17.066667 123.733333-117.333334 46.933333-46.933333 117.333334-123.733333-17.066667L512 960l-100.266667-76.8-123.733333 17.066667-46.933333-117.333334-117.333334-46.933333 17.066667-123.733333L64 512l76.8-100.266667-17.066667-123.733333 117.333334-46.933333 46.933333-117.333334 123.733333 17.066667z"
          fill="#8BC34A"
        />
        <path
          d="M738.133333 311.466667L448 601.6l-119.466667-119.466667-59.733333 59.733334 179.2 179.2 349.866667-349.866667z"
          fill="#CCFF90"
        />
      </svg>
      <h1 className="text-xl text-lime-500 text-center items-center w-fit mb-8">
        Inscription bien confirmée!
      </h1>

      <button
        onClick={() => navigate("/dashboard")}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150"
      >
        Accéder au tableau de bord
      </button>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col justify-center items-center text-center p-8 border border-red-200 rounded-lg bg-red-50">
      <svg
        width="70px"
        height="70px"
        viewBox="0 0 48 48"
        version="1"
        xmlns="http://www.w3.org/2000/svg"
        enable-background="new 0 0 48 48"
      >
        <g fill="#1976D2">
          <path d="M17.5,27c-1.1,1.2-2.7,2-4.5,2h-3c-3.3,0-6-2.7-6-6s2.7-6,6-6h3c1.8,0,3.4,0.8,4.5,2h4.7 c-1.5-3.5-5.1-6-9.2-6h-3C4.5,13,0,17.5,0,23s4.5,10,10,10h3c4.1,0,7.6-2.5,9.2-6H17.5z" />
          <path d="M38,13h-3c-4.1,0-7.6,2.5-9.2,6h4.7c1.1-1.2,2.7-2,4.5-2h3c3.3,0,6,2.7,6,6s-2.7,6-6,6h-3 c-1.8,0-3.4-0.8-4.5-2h-4.7c1.5,3.5,5.1,6,9.2,6h3c5.5,0,10-4.5,10-10S43.5,13,38,13z" />
        </g>
        <g fill="#00BCD4">
          <polygon points="19.5,4 16,6 22.1,14.1 23.4,13.3" />
          <polygon points="28.5,4 32,6 25.9,14.1 24.6,13.3" />
          <polygon points="28.5,44 32,42 25.9,33.9 24.6,34.7" />
          <polygon points="19.5,44 16,42 22.1,33.9 23.4,34.7" />
        </g>
      </svg>
      <h1 className="text-xl text-orange-500 text-center items-center w-fit mb-8">
        Erreur de Confirmation
      </h1>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-150"
      >
        Aller à la page de connexion
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        {status === "loading" && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">{message}</p>
            <div className="mt-4 animate-spin h-10 w-10 border-2 border-t-blue-500 border-gray-200 rounded-full mx-auto" />
          </div>
        )}
        {status === "success" && renderSuccess()}
        {status === "error" && renderError()}
      </div>
      <PgFooter />
    </div>
  );
}
