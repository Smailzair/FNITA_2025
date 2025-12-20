import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PgFooter from "../../components/PgFooter";
import { supabase } from "../../api/supabaseClient";

export default function DetentLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: ID + Captcha, Step 2: Password
  const [animalId, setAnimalId] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaData, setCaptchaData] = useState<
    { char: string; rotate: number }[]
  >([]);
  const [captchaInput, setCaptchaInput] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [vetName, setVetName] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate a simple random captcha string
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    const newData = [];
    for (let i = 0; i < 5; i++) {
      const char = chars.charAt(Math.floor(Math.random() * chars.length));
      result += char;
      newData.push({ char, rotate: Math.floor(Math.random() * 60) - 30 });
    }
    setCaptchaCode(result);
    setCaptchaData(newData);
  };

  useEffect(() => {
    generateCaptcha();
    const interval = setInterval(generateCaptcha, 20000);
    return () => clearInterval(interval);
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
        .select("password, created_by_email, tb_props(fam_nme, nme)")
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

      if (!data.password && data.created_by_email) {
        const { data: vetData } = await supabase
          .from("tb_login")
          .select("fam_nme, nme")
          .eq("email", data.created_by_email)
          .maybeSingle();

        if (vetData) {
          setVetName(`${vetData.fam_nme || ""} ${vetData.nme || ""}`.trim());
        }
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
      sessionStorage.setItem("detent_last_active", Date.now().toString());
      navigate("/detent/dashboard");
    } else {
      setError("Mot de passe incorrect.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <nav className="bg-teal-900 z-0">
        <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
          <div className="relative flex h-20 items-center justify-between">
            <div className="flex grow items-center justify-center sm:justify-star">
              <div className="items-center min-w-fit ml-1">
                <Link to={"/"}>
                  <img
                    src="/LOGO_ALG.png"
                    alt="LOGO_ALG"
                    width={360}
                    height={360}
                    className="h-16 w-16 min-w-full"
                  />
                </Link>
              </div>
              <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
                <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
                  République algérienne démocratique et populaire
                  <br />
                  Ministère de l&apos;Agriculture et du Développement Rural
                  <br />
                  Fichier National d&apos;Identification et Traçabilité Animale
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>
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
                  <div className="bg-gray-200 px-4 py-2 rounded-md font-mono text-lg font-bold text-gray-600 select-none flex gap-2">
                    {captchaData.map((item, index) => (
                      <span
                        key={index}
                        style={{
                          transform: `rotate(${item.rotate}deg)`,
                          display: "inline-block",
                        }}
                      >
                        {item.char}
                      </span>
                    ))}
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
          ) : !storedPassword ? (
            <div className="space-y-5">
              <h2 className="text-center text-lg font-medium text-gray-800 mb-1">
                Bonjour
              </h2>
              <h3 className="text-center text-lg font-medium text-green-900 mb-4">
                {ownerName}
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                <p className="text-yellow-800 font-medium mb-2">
                  Mot de passe non défini
                </p>
                <p className="text-sm text-yellow-700">
                  Veuillez contacter votre vétérinaire{" "}
                  {vetName && <span className="font-bold">{vetName} </span>}pour
                  créer un mot de passe pour cet animal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCaptchaInput("");
                  generateCaptcha();
                  setPassword("");
                  setStoredPassword("");
                  setOwnerName("");
                  setVetName("");
                  setShowPassword(false);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Retour
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h3 className="text-center text-lg font-medium text-gray-800">
                  Bonjour
                </h3>
                <h3 className="text-center text-lg font-medium text-green-900 mb-4">
                  {ownerName}
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe :
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
                    placeholder="Le mot de passe de l'animal"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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
                  setVetName("");
                  setShowPassword(false);
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
