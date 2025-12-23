import { useState, useEffect, type FormEvent } from "react";
import { sendPasswordResetEmail, supabase } from "../api/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { PgHeader } from "../components/PgHeader";
import PgFooter from "../components/PgFooter";

type LoginError =
  | "wrong-password"
  | "email-not-found"
  | "email-not-confirmed"
  | "wrong-captcha"
  | null;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaData, setCaptchaData] = useState<
    { char: string; rotate: number; size: number; yOffset: number }[]
  >([]);
  const [captchaInput, setCaptchaInput] = useState("");

  const [resetSent, setResetSent] = useState(false);
  const [resetErrMsg, setResetErrMsg] = useState("");
  const [ShowPass, SetshowPass] = useState(false);

  const navigate = useNavigate();

  const clearErrors = () => {
    setError(null);
    setResetSent(false);
    setResetErrMsg("");
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearErrors();
  };

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    const newData = [];
    for (let i = 0; i < 5; i++) {
      const char = chars.charAt(Math.floor(Math.random() * chars.length));
      result += char;
      newData.push({
        char,
        rotate: Math.floor(Math.random() * 60) - 30,
        size: Math.floor(Math.random() * 12) + 24,
        yOffset: Math.floor(Math.random() * 10) - 5,
      });
    }
    setCaptchaCode(result);
    setCaptchaData(newData);
  };

  useEffect(() => {
    if (loginAttempts >= 3) {
      generateCaptcha();
      const interval = setInterval(generateCaptcha, 20000);
      return () => clearInterval(interval);
    }
  }, [loginAttempts >= 3]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    if (loginAttempts >= 3) {
      if (captchaInput.toUpperCase() !== captchaCode) {
        setError("wrong-captcha");
        setLoading(false);
        generateCaptcha();
        setCaptchaInput("");
        return;
      }
    }

    // First, check if the email exists in the public profile table.
    const { data: existingUser, error: fetchError } = await supabase
      .from("tb_login")
      .select("id")
      .eq("email", formData.email)
      .single();

    // If no user is found with that email, set an error and stop.
    if (fetchError || !existingUser) {
      setError("email-not-found");
      setLoginAttempts((prev) => prev + 1);
      setLoading(false);
      return;
    }

    // If the email exists, proceed with the sign-in attempt.
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

    if (signInError) {
      console.error("Sign-in error:", signInError);
      if (signInError.message === "Email not confirmed") {
        setError("email-not-confirmed");
      } else if (signInError.message === "Invalid login credentials") {
        // Since we've confirmed the email exists, this error must mean the password is wrong.
        setError("wrong-password");
        setLoginAttempts((prev) => prev + 1);
      }
    } else {
      // ALWAYS check the database for the `validated` status.
      const { data: profile, error: profileError } = await supabase
        .from("tb_login")
        .select("type, validated, fam_nme, nme, email")
        .eq("id", signInData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // Allow login but redirect to a generic dashboard as a fallback.
        navigate("/");
        return;
      }

      if (profile) {
        // CRITICAL: Check if the admin has validated the account.
        if (!profile.validated) {
          // Sign out the user to clear the session before redirecting
          await supabase.auth.signOut();
          navigate("/notvalidatedyet", {
            state: {
              fam_nme: profile.fam_nme,
              nme: profile.nme,
              email: profile.email,
            },
          });
          setLoading(false);
          return; // Stop execution here
        }

        // User is validated, proceed with role-based redirection.
        redirectToDashboard(profile.type);
      }
    }

    setLoading(false);
  };

  const redirectToDashboard = (role: string) => {
    const roleDashboardMap: Record<string, string> = {
      Administrateur: "/admindashboard",
      "Ayant droit": "/aydroitdashboard",
      Vétérinaire: "/vetsdashboard",
    };
    navigate(roleDashboardMap[role] || "/dashboard");
  };

  return (
    <div className="flex flex-col w-screen h-screen">
      <PgHeader />
      <div className="flex flex-col justify-center items-center h-[calc(100vh-7.25rem)] w-full">
        <form
          className="bg-stone-500 flex items-center justify-around flex-col h-fit w-fit p-2 rounded-lg"
          onSubmit={handleLogin}
        >
          <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-fit">
            Connexion
          </h1>
          <div className="border-t-1 border-gray-400 w-[80%] m-2 " />
          <ul className="flex flex-col items-end pt-2">
            <li>
              <span>Email : </span>
              <input
                className={`m-1 rounded-md text-black pl-1 ${
                  error === "email-not-confirmed"
                    ? "bg-orange-400"
                    : "bg-gray-300"
                }`}
                type="email"
                name="email"
                placeholder="Email"
                required={true}
                value={formData.email}
                onChange={handleFormChange}
                autoComplete="email"
              />
            </li>

            <li className="flex flex-row justify-end">
              <span>Mot de passe : </span>
              <input
                className={`m-1 rounded-md text-black pl-1 ${
                  error === "wrong-password" ? "bg-red-400" : "bg-gray-300"
                }`}
                type={ShowPass ? "text" : "password"}
                name="password"
                placeholder="Mot de passe"
                required={true}
                value={formData.password}
                onChange={handleFormChange}
                autoComplete="current-password"
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
                  SetshowPass(!ShowPass);
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${
                  ShowPass ? "hidden" : ""
                }`}
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
                  SetshowPass(!ShowPass);
                }}
                className={`mt-1 mr-1 absolute text-gray-700 ${
                  !ShowPass ? "hidden" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
            </li>

            {loginAttempts >= 3 && (
              <li className="flex flex-col items-end mt-2 w-full">
                <div className="flex flex-row items-center justify-end gap-2 mb-1 mr-1">
                  <div
                    className="bg-gray-200 px-2 py-1 rounded-md font-mono font-bold text-gray-600 select-none flex items-center justify-center overflow-hidden relative w-32 h-10 border border-gray-300"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
                    }}
                  >
                    {captchaData.map((item, index) => (
                      <span
                        key={index}
                        style={{
                          transform: `rotate(${item.rotate}deg) translateY(${item.yOffset}px)`,
                          fontSize: `${item.size * 0.8}px`,
                          display: "inline-block",
                          margin: "0 2px",
                        }}
                      >
                        {item.char}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-xs text-blue-300 hover:text-blue-100 hover:underline"
                  >
                    Actualiser
                  </button>
                </div>
                <div className="flex flex-row justify-end items-center">
                  <span>Code : </span>
                  <input
                    className={`m-1 rounded-md text-black pl-1 ${
                      error === "wrong-captcha" ? "bg-red-400" : "bg-gray-300"
                    }`}
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Code"
                    required
                  />
                </div>
              </li>
            )}
          </ul>

          <div className="flex flex-row justify-end items-center w-full">
            <div className="flew flex-col">
              {error === "email-not-found" && (
                <Link
                  to={`/Register${
                    formData.email ? "?email=" + formData.email : ""
                  }`}
                  className="text-yellow-400 text-center text-xs flex font-semibold mr-4"
                >
                  Email non enregistré
                  <br />
                  créer un compte?
                </Link>
              )}
              {error === "wrong-password" && !resetSent && (
                <button
                  className="text-red-400 text-center text-xs flex font-semibold mr-10 bg-transparent hover:bg-transparent border-none hover:text-red-600"
                  onClick={async () => {
                    const { success, message } = await sendPasswordResetEmail(
                      formData.email
                    );
                    setResetSent(success);
                    if (!success) setResetErrMsg(message);
                  }}
                >
                  Mot de passe
                  <br />
                  oublié?
                </button>
              )}
              {error === "wrong-password" && resetSent && (
                <p className="text-yellow-400 text-center text-xs mr-4">
                  Un lien de réinitialisation
                  <br />a été envoyé a votre email.
                </p>
              )}
              {error === "wrong-password" &&
                !resetSent &&
                resetErrMsg.length > 0 && (
                  <p className="text-yellow-400 text-center text-xs mr-4">
                    {resetErrMsg}
                  </p>
                )}
              {error === "email-not-confirmed" && (
                <h1 className="text-yellow-400 text-center text-xs flex font-semibold mr-4">
                  Veuillez confirmer votre e-mail
                  <br />
                  avant de vous connecter.
                </h1>
              )}
              {error === "wrong-captcha" && (
                <p className="text-red-400 text-center text-xs font-semibold mr-4">
                  Code de sécurité incorrect.
                </p>
              )}
            </div>

            <button
              className="flex flex-row justify-center items-center bg-cyan-700 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-2 mt-2 mr-10 w-inherit"
              type="submit"
              disabled={loading}
            >
              Se Connecter
              {loading && (
                <div className="ml-2 animate-spin h-7 w-7 border-2 border-t-blue-500 border-gray-200 rounded-full mx-auto" />
              )}
            </button>
          </div>
          <div className="border-t-1 border-gray-400 w-[80%] m-2 mt-5" />
          <Link to={"/Register"}>
            <button
              type="button"
              className="relative flex flex-row justify-center items-center rounded-full pr-2 bg-gray-700 p-1 text-gray-400 hover:text-white hover:outline-2 hover:outline-gray-800"
            >
              <svg
                className="w-9 h-9 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              Ajouter un compte
            </button>
          </Link>
        </form>
      </div>
      <PgFooter />
    </div>
  );
}
