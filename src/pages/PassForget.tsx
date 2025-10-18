import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useParams } from "react-router-dom";
import { PgHeader } from "../components/PgHeader";
import PgFooter from "../components/PgFooter";

export default function PassForget() {
  const { email: paramEmail } = useParams<{ email?: string }>();
  const [email, setEmail] = useState(paramEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // try to prefill from params if provided
    if (paramEmail) setEmail(paramEmail);
  }, [paramEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // optional: set redirect URL to your app's reset page
        // configure SUPABASE in dashboard to allow the redirect URL
        redirectTo: `${window.location.origin}/ResetPassword`,
      });
      if (error) {
        setMessage(error.message || "Erreur lors de l'envoi du mail.");
      } else {
        setMessage(
          "Si l'adresse e-mail existe, vous recevrez un lien pour réinitialiser le mot de passe. Vérifiez votre boîte de réception."
        );
      }
    } catch (err: unknown) {
      // handle unknown error safely
      if (err instanceof Error) setMessage(err.message);
      else setMessage(String(err) || "Erreur inattendue.");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-stone-500 flex items-center justify-around flex-col h-fit w-fit p-4 rounded-lg"
        >
          <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-fit">
            Mot de passe oublié
          </h1>

          <label className="flex flex-col text-white mt-4">
            Email
            <input
              type="email"
              className="m-1 rounded-md text-black bg-gray-300 pl-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <div className="flex mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-700 text-white px-4 py-2 rounded"
            >
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
          </div>

          {message && <p className="mt-4 text-sm text-yellow-200">{message}</p>}
        </form>
      </div>
      <PgFooter />
    </div>
  );
}
