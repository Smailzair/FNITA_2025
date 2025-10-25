import { useEffect, useState, type FormEvent } from "react";
import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";
import WilayaComboBox from "../components/WilayaComboBox";
import { supabase } from "../api/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function UserInfosUpdate() {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const { user, role } = useAuth();
  const { userId } = useParams<{ userId?: string }>();

  const [formData, setFormData] = useState({
    famName: "",
    name: "",
    email: "",
    password: "",
    password2: "",
    telNum: "",
    address: "",
    city: "",
    cni: "",
    anv: "",
    wilaya: "",
    type: "",
    asking_to_delete: false,
  });

  const [originalEmail, setOriginalEmail] = useState("");
  const [ShowPass, SetshowPass] = useState(true);
  const [ShowPass2, SetshowPass2] = useState(true);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't run if we don't have a URL param and the auth hook is still loading the user.
      if (!userId && !user) {
        // The effect will re-run when `user` is populated by useAuth.
        return;
      }

      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setError("Utilisateur non trouvé.");
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("tb_login")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError) {
        setError("Erreur lors de la récupération du profil.");
        setLoading(false);
        return;
      }

      if (data) {
        setFormData({ ...data, password: "", password2: "" });
        setOriginalEmail(data.email);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user, userId]);

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(
        (window.innerHeight <= 455 && window.innerWidth > 490) ||
          (window.innerHeight <= 600 && window.innerWidth <= 500) ||
          (window.innerHeight <= 600 && window.innerWidth <= 338)
      );
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  async function HandleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      setError("Utilisateur non identifiable pour la mise à jour.");
      setLoading(false);
      return;
    }

    // Admin role change restriction
    if (
      role === "Administrateur" &&
      formData.type !== "Administrateur" &&
      targetUserId === user?.id
    ) {
      const { count, error: countError } = await supabase
        .from("tb_login")
        .select("*", { count: "exact", head: true })
        .eq("type", "Administrateur");

      if (countError || count === 1) {
        setError(
          "Impossible de changer votre rôle, vous êtes le seul administrateur."
        );
        setLoading(false);
        return;
      }
    }

    // Update profile data in tb_login
    const { password, password2, email, ...profileData } = formData;
    const { error: profileError } = await supabase
      .from("tb_login")
      .update(profileData)
      .eq("id", targetUserId);

    if (profileError) {
      setError(`Erreur de mise à jour du profil: ${profileError.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Informations du profil mises à jour avec succès.");
    setLoading(false);
  }

  async function handleAuthUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setError("");
    setAuthLoading(true);

    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      setError("Utilisateur non identifiable pour la mise à jour.");
      setAuthLoading(false);
      return;
    }

    const authUpdates: { email?: string; password?: string } = {};
    if (formData.email !== originalEmail) {
      authUpdates.email = formData.email;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        setPasswordError("bg-red-400");
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setAuthLoading(false);
        return;
      }
      if (formData.password !== formData.password2) {
        setPasswordError("bg-red-400");
        setError("Les mots de passe ne correspondent pas.");
        setAuthLoading(false);
        return;
      }
      authUpdates.password = formData.password;
    }

    if (Object.keys(authUpdates).length === 0) {
      setError("Aucun changement d'email ou de mot de passe à enregistrer.");
      setAuthLoading(false);
      return;
    }

    // 1. Update auth data (email/password)
    const { error: authError } = await supabase.auth.updateUser(authUpdates);
    if (authError) {
      setError(
        `Erreur de mise à jour d'authentification: ${authError.message}`
      );
      setAuthLoading(false);
      return;
    }

    // 2. If email was changed, update it in tb_login as well
    if (authUpdates.email) {
      const { error: profileError } = await supabase
        .from("tb_login")
        .update({ email: authUpdates.email })
        .eq("id", targetUserId);

      if (profileError) {
        setError(
          `Erreur de mise à jour de l'email dans le profil: ${profileError.message}`
        );
        setAuthLoading(false);
        return;
      }
    }

    let successMessage = "✅ Informations de sécurité mises à jour.";
    if (authUpdates.email) {
      successMessage += "\n Veuillez confirmer votre nouvelle adresse e-mail.";
    }
    setAuthMessage(successMessage);

    // 3. Logout if user updated their own sensitive info
    if (targetUserId === user?.id) {
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login");
      }, 3000);
    } else {
      setAuthLoading(false);
    }
  }

  async function handleAccountDeleteRequest(status: boolean) {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("tb_login")
      .update({ asking_to_delete: status })
      .eq("id", user.id);
    setLoading(false);
    if (error) setError(error.message);
    else
      setMessage(
        `Demande de suppression de compte ${status ? "envoyée" : "annulée"}.`
      );
    setFormData((p) => ({ ...p, asking_to_delete: status }));
  }

  function handleFormChange(e: React.FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value, // Use the name attribute to update the correct state field
    }));

    if (name === "password" || name === "password2") {
      setPasswordError("");
    }

    setError("");
    setMessage("");
    setAuthMessage("");
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader2 />
      <div className="flex flex-col justify-start items-center h-[calc(100vh-7.25rem)] w-full overflow-y-auto py-4">
        <form
          className="bg-stone-500 flex flex-row flex-wrap items-center justify-center p-2 rounded-lg min-w-80 max-w-2xl"
          onSubmit={HandleSubmit}
          onChange={handleFormChange}
          autoComplete="on"
          noValidate
        >
          {!isSmallScreen && (
            <>
              <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-full">
                Mettre à jour le profil
              </h1>
              <div className="border-t-1 border-gray-400 w-[80%] m-2 mb-4" />
            </>
          )}

          <div className="row flex w-full justify-center items-center space-x-3">
            <div
              className={`flex flex-col items-center ${
                role !== "Administrateur" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() =>
                role === "Administrateur" &&
                setFormData((p) => ({ ...p, type: "Vétérinaire" }))
              }
              title="Médecin Vétérinaire"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-1 0 19 19"
                width="27"
                height="27"
                fill="currentColor"
              >
                <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-3.193-.767a1.588 1.588 0 1 0-1.999 1.534v1.515a2.014 2.014 0 0 1-4.027 0v-.334a2.676 2.676 0 0 0 2.262-2.64v-2.14a1.244 1.244 0 0 0-.506-1.002.894.894 0 1 0-.395.754.424.424 0 0 1 .08.248v2.14a1.851 1.851 0 1 1-3.703 0v-2.14a.422.422 0 0 1 .1-.273.895.895 0 1 0-.356-.77 1.245 1.245 0 0 0-.565 1.043v2.14a2.676 2.676 0 0 0 2.262 2.64v.334a2.835 2.835 0 1 0 5.67 0v-1.515a1.59 1.59 0 0 0 1.177-1.534zm-.821 0a.767.767 0 1 1-.767-.767.768.768 0 0 1 .767.767z"></path>
              </svg>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Vétérinaire"
                  checked={formData.type === "Vétérinaire"}
                  readOnly={true}
                  disabled={role !== "Administrateur"}
                  className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                Vétérinaire
              </label>
            </div>
            <div className="text-gray-400"> | </div>
            <div
              className={`flex flex-col items-center ${
                role !== "Administrateur" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() =>
                role === "Administrateur" &&
                setFormData((p) => ({ ...p, type: "Ayant droit" }))
              }
              title="Personne autorisée par le ministère et les administrateurs (Police, Gendarmerie etc...)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M2.91312 11.6739C3.23584 10.1953 3.53865 8.80805 2 6.5L5.5 2.5C5.5 2.5 9 4 12 1.5C15 4 18.5 2.5 18.5 2.5L22 6.5C20.4612 8.8081 20.7641 10.1954 21.0868 11.674C21.3933 13.0781 21.7177 14.5645 20.5 17C19.3425 19.315 17.3478 20.1227 15.4849 20.877C14.1289 21.4261 12.8428 21.9469 12.0003 23C11.1577 21.9469 9.8715 21.4261 8.51549 20.8771C6.65245 20.1227 4.65758 19.315 3.50001 17C2.28218 14.5645 2.60663 13.078 2.91312 11.6739ZM14.3776 12.7725L16.7552 10.4549L13.4694 9.97746L11.9999 7L10.5304 9.97746L7.24463 10.4549L9.62227 12.7725L9.06098 16.0451L11.9999 14.5L14.9388 16.0451L14.3776 12.7725Z"></path>
              </svg>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Ayant droit"
                  checked={formData.type === "Ayant droit"}
                  readOnly={true}
                  disabled={role !== "Administrateur"}
                  className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                Ayant droit
              </label>
            </div>
            <div className="text-gray-400"> | </div>
            <div
              className={`flex flex-col items-center ${
                role !== "Administrateur" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() =>
                role === "Administrateur" &&
                setFormData((p) => ({ ...p, type: "Administrateur" }))
              }
              title="Ministre et administrateur du site"
            >
              <svg
                fill="currentColor"
                width="28"
                height="28"
                viewBox="-1 0 19 19"
                xmlns="http://www.w3.org/2000/svg"
                className="cf-icon-svg"
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke="#CCCCCC"
                  stroke-width="0.266"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-2.853 3.368a.318.318 0 0 0-.316-.316h-.334v-.394a.318.318 0 0 0-.316-.317H12.3V9.25h.214a.396.396 0 0 0 0-.79H4.457a.396.396 0 0 0 0 .79h.226v2.67H4.35a.318.318 0 0 0-.317.317v.394H3.7a.318.318 0 0 0-.317.316v.394h10.182zm-8.88-5.144H12.3a3.808 3.808 0 0 0-7.617 0zM6.35 9.67v2.25h-.79V9.67a.396.396 0 0 1 .791 0zm1.686.006v2.244h-.791V9.676a.396.396 0 0 1 .791 0zm1.686.007v2.237h-.791V9.683a.396.396 0 0 1 .791 0zm1.686.006v2.231h-.792V9.69a.396.396 0 0 1 .792 0z"></path>
                </g>
              </svg>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Administrateur"
                  checked={formData.type === "Administrateur"}
                  readOnly={true}
                  disabled={role !== "Administrateur"}
                  className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                Administrateur
              </label>
            </div>
          </div>
          {role !== "Administrateur" && (
            <p className="text-xs text-gray-300 mt-2 w-full text-center">
              Seul un administrateur peut modifier le type de compte.
            </p>
          )}
          <div className="border-t-0 border-2 border-gray-400 w-full m-2"></div>

          {/* --------------------------Proprietaire -------------------------- */}
          <div className="flex flex-wrap justify-center items-start">
            <label
              className="flex text-orange-200 w-72 items-center justify-end"
              title="Nom du famille"
            >
              Nom :
              <input
                className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200"
                type="text"
                name="famName"
                placeholder="Nom"
                autoComplete="family-name"
                value={formData.famName}
                required={true}
              />
            </label>
            <label
              className="flex text-orange-200 w-72 items-center justify-end"
              title="Prénom"
            >
              Prénom :
              <input
                className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200"
                type="text"
                name="name"
                placeholder="Prénom"
                // standard token for given/first name
                autoComplete="given-name"
                value={formData.name}
                required={true}
              />
            </label>
            <label
              className={`flex ${
                formData.type === "Vétérinaire" ? "text-orange-200" : ""
              } w-72 items-center justify-end`}
              title="Numéro de téléphone"
            >
              N° Tél :
              <input
                className={`m-1 rounded-md text-black pl-1 w-45  ${
                  formData.type === "Vétérinaire" ? "!border-orange-200" : ""
                }`}
                id="phone"
                name="telNum"
                type="tel"
                placeholder="N° Tél"
                value={formData.telNum}
                required={formData.type === "Vétérinaire"}
              />
            </label>
            <label
              className="flex w-72 items-center justify-end"
              title="Numéro de la carte nationale d'identité"
            >
              N° CNI :
              <input
                className="m-1 rounded-md text-black pl-1 w-45"
                type="text"
                name="cni"
                value={formData.cni}
                placeholder="N° Carte Nationale d'Identité"
              />
            </label>
            {formData.type === "Vétérinaire" && (
              <label
                className={"flex  w-72 items-center justify-end"}
                title="Code de l'Autorité Vétérinaire Nationale"
              >
                ANV :
                <input
                  className="m-1 rounded-md text-black pl-1 w-45 "
                  type="text"
                  name="anv"
                  value={formData.anv}
                  placeholder="Code Autorité Vétérinaire Nationale"
                />
              </label>
            )}
            <label className="flex w-72 items-center justify-end cl">
              Wilaya :
              <WilayaComboBox
                value={formData.wilaya ?? ""}
                onChange={(val) => setFormData((p) => ({ ...p, wilaya: val }))}
              />
            </label>
            <label className="flex w-72 items-center justify-end">
              Cité :
              <input
                className="m-1 rounded-md text-black pl-1 w-45"
                type="text"
                name="city"
                value={formData.city}
                placeholder="Cité"
              />
            </label>
            <label className="flex w-72 items-start justify-end">
              <span className="mt-1">Adresse :</span>
              <textarea
                name="address"
                className="m-1 rounded-md text-black pl-1 w-45 h-15"
                placeholder="Adresse"
                value={formData.address}
              />
            </label>
          </div>
          <div className="row w-full flex justify-center items-center gap-4 mt-4">
            <div
              className="flex w-full items-center ml-3"
              title="Les champs marqués sont obligatoires"
            >
              <label className="w-fit text-xs h-4  border text-transparent border-orange-200 rounded-lg mr-1 justify-center items-center">
                ***
              </label>
              <label className="text-orange-200 w-fit text-xs justify-center items-center">
                Champs obligés
              </label>
            </div>
          </div>

          <div className="row w-full flex justify-center items-center gap-4">
            <button
              type="submit"
              className="bg-green-700 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-1.5 m-2 w-36"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
            {message && (
              <p className="text-green-300 font-semibold max-w-xs text-center">
                {message}
              </p>
            )}
            {error && <p className="text-red-400 font-semibold">{error}</p>}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-1.5 m-2 w-36"
            >
              Annuler
            </button>
          </div>
          <div className="border-t-2 border-gray-400 w-full m-2"></div>
          <div className="flex w-full justify-center items-center gap-4 p-2">
            {formData.asking_to_delete ? (
              <button
                type="button"
                onClick={() => handleAccountDeleteRequest(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2xl"
              >
                Annuler la demande de suppression
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAccountDeleteRequest(true)}
                className="bg-yellow-600 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded-2xl"
              >
                Demander la suppression du compte
              </button>
            )}
          </div>
        </form>

        {/* --- Auth Update Form --- */}
        <form
          className="bg-stone-600 flex flex-row flex-wrap items-center justify-center p-2 rounded-lg min-w-80 max-w-2xl mt-4"
          onSubmit={handleAuthUpdate}
          onChange={handleFormChange}
          autoComplete="off"
          noValidate
        >
          <h2 className="text-xl font-bold text-slate-300 text-center items-center w-full">
            Sécurité du compte
          </h2>
          <div className="border-t-1 border-gray-400 w-[80%] m-2 mb-4" />

          <div className="flex flex-wrap justify-center">
            <div
              className="flex flex-col items-center justify-center"
              title={`Important : utilisez une adresse e-mail valide,\ncar vous en aurez besoin pour confirmer votre inscription.`}
            >
              <label className="flex text-orange-200 w-72 items-center justify-end">
                Email :
                <input
                  className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200"
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={formData.email}
                  required={true}
                />
              </label>
              {formData.email !== originalEmail && (
                <p className="text-red-400 text-xs w-72 text-center">
                  La confirmation sera requise pour la nouvelle adresse e-mail.
                </p>
              )}
            </div>

            <div>
              <label
                className="flex w-72 items-center justify-end"
                title="Laissez vide pour ne pas changer"
              >
                Nouveau mot de passe :
                <input
                  className={`m-1 rounded-md text-black pl-1 w-45 ${passwordError}`}
                  name="password"
                  type={ShowPass ? "password" : "text"}
                  placeholder="Laissez vide pour ne pas changer"
                  value={formData.password}
                  autoComplete="new-password"
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
                  }}
                  style={{ display: ShowPass ? "block" : "none" }}
                  className="mr-1 absolute text-gray-400 cursor-pointer"
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
                  }}
                  style={{ display: ShowPass ? "none" : "block" }}
                  className="mr-1 absolute text-gray-400 cursor-pointer"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  ></path>
                </svg>
              </label>

              <label
                className="flex w-72 items-center justify-end"
                title="Veuillez retapper le mot de passe pour le confirmer"
              >
                Confirmer :
                <input
                  className={`m-1 rounded-md text-black pl-1 w-45 ${passwordError}`}
                  name="password2"
                  type={ShowPass2 ? "password" : "text"}
                  placeholder="Confirmer"
                  value={formData.password2}
                  autoComplete="new-password"
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
                  }}
                  style={{ display: ShowPass2 ? "block" : "none" }}
                  className="mr-1 absolute text-gray-400 cursor-pointer"
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
                  }}
                  style={{ display: ShowPass2 ? "none" : "block" }}
                  className="mr-1 absolute text-gray-400 cursor-pointer"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  ></path>
                </svg>
              </label>
            </div>
          </div>
          <div className="row w-full flex justify-center items-center gap-4 mt-4">
            <button
              type="submit"
              className="bg-green-700 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-1.5 m-2 w-55"
              disabled={authLoading}
            >
              {authLoading ? "Enregistrement..." : "Changer Email/Mot de passe"}
            </button>
            {authMessage && (
              <p className="text-green-300 font-semibold max-w-xs text-center">
                {authMessage}
              </p>
            )}
          </div>
        </form>
      </div>
      <PgFooter />
    </div>
  );
}
