import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, getUserByEmail } from "../api/supabaseClient";
import { authState } from "../api/auth-state";
import DashboardNavBar from "./DashboardNavBar";

export const PgHeader2 = () => {
  const [user_full_name, setUserFullName] = useState<string | null>(null);
  const [user_name, setUserName] = useState<string | null>(null);
  const [user_type, setUserType] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
      } else {
        const user_infos = await getUserByEmail(session.user.email as string);
        if (user_infos) {
          setUserFullName(user_infos.fam_nme || null);
          setUserName(user_infos.nme || null);
          setUserType(user_infos.type || null);
        }
      }
    };
    getSession();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate]);

  const handleLogout = async () => {
    authState.isLoggingOut = true;
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header>
      <nav className="bg-teal-900">
        <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
          <div className="relative flex h-20 items-center justify-between">
            <div className="flex flex-grow items-center justify-center sm:justify-star">
              <div className="items-center min-w-fit ml-1">
                <Link to={".."}>
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
              <div className="inset-y-0 right-0 flex flex-col items-center pr-2 max-xs:hidden min-w-fit text-xs w-fit h-full justify-center">
                {/* <label className="text-green-200 text-center">Bienvenue</label> */}
                <label className="text-slate-200 text-center">
                  {user_full_name}
                  <br />
                  {user_name}
                </label>
                <label className="text-orange-200 text-center mb-0.75">
                  - {user_type} -
                </label>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-stone-700 hover:bg-stone-500 p-0 rounded-md flex justify-center items-center w-20 border-1 border-gray-600 outline-none ring-offset-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1"
                      stroke="currentColor"
                      className="w-5.5 h-5.5 text-gray-200"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.003-.827c.293-.24.438-.613.438.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                      />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <Link
                          to="/UserInfosUpdate"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Mon Profil
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Déconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <DashboardNavBar role={user_type} />
    </header>
  );
};
