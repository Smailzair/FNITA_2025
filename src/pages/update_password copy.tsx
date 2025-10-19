import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { PgHeader } from "../components/PgHeader";
import PgFooter from "../components/PgFooter";
const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // State for form inputs
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for UI/loading feedback
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Vérification du lien...");
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Check: Wait for Supabase to process the token in the URL
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Clear the URL parameters immediately for a cleaner look and security
      // Note: Supabase SDK handles reading the token from the URL automatically
      // when the page loads, setting the temporary session.
      history.replaceState(null, "", "/update_password");

      // Wait a moment for Supabase to process the URL fragment/query
      // This is often necessary in client-side rendered apps (like React Router)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // If a user session is active (meaning the token was valid), proceed.
        setLoading(false);
        setMessage("Veuillez saisir votre nouveau mot de passe.");
        setError(null);
      } else {
        // Token was invalid, expired, or not present.
        setLoading(false);
        setError(
          "Le lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande de réinitialisation."
        );
      }
    };

    checkAuthStatus();
  }, []);

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

    // The temporary session created by the URL token allows us to call updateUser()
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      console.error("Error updating password:", updateError);
      setError(`Échec de la mise à jour : ${updateError.message}`);
      setMessage("Échec. Veuillez réessayer ou refaire une demande.");
    } else {
      setMessage("Mot de passe mis à jour avec succès ! Redirection...");

      // Optionally sign the user out to force a fresh login, or just redirect.
      // await supabase.auth.signOut();

      // Redirect to dashboard or home page (user is already logged in with new password)
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  };

  // 3. Conditional Rendering (UI)

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
