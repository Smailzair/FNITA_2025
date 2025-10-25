import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import PgFooter from "../components/PgFooter";
import { PgHeader } from "../components/PgHeader";

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    "Vérification du jeton de réinitialisation..."
  );
  const [error, setError] = useState<string | null>(null);
  const [SecondPassError, setSecondPassError] = useState(false);
  const [ShowPass, SetshowPass] = useState(true);
  const [ShowPass2, SetshowPass2] = useState(true);
  const PassInput = useRef<HTMLInputElement | null>(null);
  const PassInput2 = useRef<HTMLInputElement | null>(null);

  // States to hold the token data once read from URL
  //   const [tokenHash, setTokenHash] = useState<string | null>(null);

  // 1. Check and Verify Token on Load
  useEffect(() => {
    const hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!hash || type !== "recovery") {
      setLoading(false);
      setError("Lien de réinitialisation invalide ou manquant.");
      return;
    }

    // Attempt to verify the token to establish a session
    const verifyRecoveryToken = async () => {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: hash,
        type: "recovery" as const, // Must be 'recovery' for password reset
      });

      if (verifyError) {
        setLoading(false);
        setError(
          "Le lien de réinitialisation a expiré ou est invalide. Veuillez refaire une demande."
        );
        return;
      }

      if (data.user) {
        // Token verified successfully. Session is now active.
        // setTokenHash(hash); // Keep hash just in case, though session is now active
        setLoading(false);
        setMessage("Jeton validé. Saisissez votre nouveau mot de passe.");
        // Clear URL of tokens for security and clean display
        history.replaceState(null, "", "/update-password");
      } else {
        setLoading(false);
        setError("Impossible d'établir la session de réinitialisation.");
      }
    };

    verifyRecoveryToken();
  }, [searchParams]);

  // 2. Form Submission Handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setSecondPassError(true);
      // setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setMessage("Mise à jour du mot de passe en cours...");

    // We can now call updateUser() because the verifyOtp() step established an active session
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      // If the token expires between verifyOtp and updateUser, this might fail.
      setError(
        `Échec de la mise à jour: ${updateError.message}. Le jeton a peut-être expiré.`
      );
      setLoading(false);
    } else {
      setLoading(false);
      //-------------
      setMessage("Mot de passe mis à jour avec succès ! Redirection...");
      setTimeout(() => navigate("/dashboard"), 2500);
    }
  };

  // 3. Conditional Rendering (UI) remains the same as previous response
  // ... (render logic for loading, error, and the form) ...

  if (loading) {
    return (
      <div className="flex flex-col w-screen h-screen">
        <PgHeader />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full "></div>
        <div className="p-8 bg-white shadow-lg rounded-lg text-center">
          <p className="text-xl text-blue-600">{message}</p>
          <div className="mt-4 animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
        </div>
        <PgFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-screen h-screen">
        <PgHeader />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
          <div className="flex justify-center items-center bg-gray-100">
            <div className="p-8 bg-white shadow-lg rounded-lg max-w-sm w-full text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Aller à la page de connexion
              </button>
            </div>
          </div>
        </div>
        <PgFooter />
      </div>
    );
  }

  // Password Update Form (Only rendered if token is valid and session is active)
  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          onSubmit={handlePasswordUpdate}
          className="bg-stone-500 flex items-center justify-around flex-col h-fit w-fit p-2 rounded-lg"
        >
          <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-fit">
            Mettre à Jour le Mot de Passe
          </h1>
          <div className="border-t-1 border-gray-400 w-[80%] m-2 " />
          {message && message.includes("succès") && (
            <p className="mb-4 text-green-600 text-center font-medium">
              {message}
            </p>
          )}

          <div className="mb-6">
            <label
              className="flex text-orange-300 w-72 items-center justify-end"
              title="Mot de passe d'accès au compte"
            >
              Mot de passe :
              <input
                className={`m-1 rounded-md text-black pl-1 w-45 !border-orange-200`}
                name="password"
                type={ShowPass ? "password" : "text"}
                placeholder="Mot de passe"
                required={true}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                ref={PassInput}
              />
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass(false);
                  PassInput.current?.focus();
                }}
                style={{ display: ShowPass ? "block" : "none" }}
                className="mr-1 absolute text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass(true);
                  PassInput.current?.focus();
                }}
                style={{ display: ShowPass ? "none" : "block" }}
                className="mr-1 absolute text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
            </label>

            <label
              className="flex text-orange-400 w-72 items-center justify-end"
              title="Veuillez retapper le mot de passe pour le confirmer"
            >
              Confirmer :
              <input
                className={`m-1 rounded-md text-black pl-1 w-45 !border-orange-200 ${SecondPassError ? "bg-red-500" : ""}`}
                name="password2"
                type={ShowPass2 ? "password" : "text"}
                placeholder="Confirmer"
                required={true}
                id="confirmPassword"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setSecondPassError(false);
                }}
                ref={PassInput2}
              />
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass2(false);
                  PassInput2.current?.focus();
                }}
                style={{ display: ShowPass2 ? "block" : "none" }}
                className="mr-1 absolute text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                onClick={() => {
                  SetshowPass2(true);
                  PassInput2.current?.focus();
                }}
                style={{ display: ShowPass2 ? "none" : "block" }}
                className="mr-1 absolute text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm italic mb-4">{error}</p>}

          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Mise à Jour..." : "Changer le Mot de Passe"}
            </button>
          </div>
        </form>
      </div>
      <PgFooter />
    </div>
  );
};

export default UpdatePasswordPage;
