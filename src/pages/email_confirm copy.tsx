// pages/email_confirm.tsx or app/email_confirm/page.tsx

import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";

type Status = "loading" | "success" | "error";

export default function EmailConfirm() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Vérification de votre compte...");
  const navigate = useNavigate();
  // Use useEffect to run the verification logic once the component mounts
  useEffect(() => {
    // 1. Get query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get("token_hash");
    const type = urlParams.get("type");

    if (!tokenHash || type !== "signup") {
      setStatus("error");
      setMessage("Lien de confirmation manquant ou invalide.");
      return;
    }

    // Optional: Clean the URL for a cleaner display
    // history.replaceState(null, '', '/email_confirm');

    const verifyToken = async () => {
      // 2. Call the Supabase verification endpoint
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "signup" as const, // 'signup' must be a valid EmailOtpType        
      });

      console.log("Confirmation Data:", data);
      console.log("Confirmation Error:", error);


      if (error) {
        // 3. Handle failure (e.g., token expired, invalid, or already used)
        setStatus("error");
        setMessage(
          "La vérification a échoué. Le lien a peut-être expiré ou a déjà été utilisé."
        );
        console.error("Confirmation Error:", error);
      } else if (data.user) {
        // 4. Handle success (User is confirmed AND logged in)
        setStatus("success");
        setMessage("Votre compte est maintenant confirmé !");
      } else {
        // 5. Fallback for unexpected case (e.g., no error, but no user data)
        setStatus("error");
        setMessage("Une erreur inattendue est survenue.");
      }
    };

    verifyToken();
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
    <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50">
      <h2 className="text-2xl font-bold text-red-700 mb-4">
        Erreur de Confirmation 😥
      </h2>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={() => navigate("/login")}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150"
      >
        Aller à la page de connexion
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        {status === "success" && renderSuccess()}

        {status === "error" && renderError()}
      </div>
      <PgFooter />
    </div>
  );
}
