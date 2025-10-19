import React, { useState, useEffect } from "react";
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
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setMessage("Mise à jour du mot de passe en cours...");

    // We can now call updateUser() because the verifyOtp() step established an active session
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      // If the token expires between verifyOtp and updateUser, this might fail.
      setError(
        `Échec de la mise à jour: ${updateError.message}. Le jeton a peut-être expiré.`
      );
    } else {
      setMessage("Mot de passe mis à jour avec succès ! Redirection...");
      setTimeout(() => navigate("/dashboard"), 1500);
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
          className="p-8 bg-white shadow-xl rounded-xl max-w-md w-full"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Mettre à Jour le Mot de Passe
          </h1>

          {message && message.includes("succès") && (
            <p className="mb-4 text-green-600 text-center font-medium">
              {message}
            </p>
          )}

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Nouveau Mot de Passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Confirmer le Mot de Passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
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
