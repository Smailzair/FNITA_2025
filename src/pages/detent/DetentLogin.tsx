import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PgFooter from "../../components/PgFooter";
import { supabase } from "../../api/supabaseClient";

export default function DetentLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: ID + Captcha, Step 2: Password
  const [animalId, setAnimalId] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate a simple random captcha string
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (captchaInput.toUpperCase() !== captchaCode) {
      setError("Code de sécurité incorrect. Veuillez réessayer.");
      generateCaptcha();
      setCaptchaInput("");
      return;
    }

    if (!animalId.trim()) {
      setError("Veuillez saisir un numéro d'identification.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("tb_animals")
        .select("password, tb_props(fam_nme, nme)")
        .eq("num_ident", animalId)
        .single();

      if (error || !data) {
        setError("Ce numéro d'identification n'existe pas.");
        setIsLoading(false);
        return;
      }

      setStoredPassword(data.password);

      // Handle owner name safely
      const owner = data.tb_props as any;
      if (owner) {
        const name = `${owner.fam_nme || ""} ${owner.nme || ""}`.trim();
        setOwnerName(name || "Propriétaire");
      } else {
        setOwnerName("Propriétaire");
      }

      setIsLoading(false);
      setStep(2);
    } catch (err) {
      setError("Une erreur est survenue.");
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password === storedPassword) {
      sessionStorage.setItem("detent_animal_id", animalId);
      navigate("/detent/dashboard");
    } else {
      setError("Mot de passe incorrect.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <header className="w-full bg-white shadow-md py-4 px-8 flex justify-between items-center z-20">
        <div
          className="text-xl font-bold text-gray-800 cursor-pointer"
          onClick={() => navigate("/")}
        >
          FNITA
        </div>
        <div className="text-sm text-gray-600">Espace Détenteur</div>
      </header>
      <main
        className="flex-1 flex items-center justify-center p-4"
        style={{
          backgroundImage: "url(/PagesBg/002.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full bg-opacity-95 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Espace Détenteur
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Connectez-vous avec le numéro d'identification de l'animal et son
            mot de passe.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro d'identification de l'animal :
                </label>
                <input
                  type="text"
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ex: 25026..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code de sécurité
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="bg-gray-200 px-4 py-2 rounded-md font-mono text-lg tracking-widest font-bold text-gray-600 select-none"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    {captchaCode}
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Actualiser
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Recopiez le code ci-dessus"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 shadow-md disabled:opacity-50"
              >
                {isLoading ? "Vérification..." : "Suivant"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h3 className="text-center text-lg font-medium text-gray-800 mb-4">
                  Bonjour {ownerName}
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Votre mot de passe"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 shadow-md disabled:opacity-50"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCaptchaInput("");
                  generateCaptcha();
                  setPassword("");
                  setStoredPassword("");
                  setOwnerName("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Retour
              </button>
            </form>
          )}
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
