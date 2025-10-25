import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserByEmail, supabase } from "../api/supabaseClient";
import DashboardNavBar from "./DashboardNavBar";

export const PgHeader2 = () => {
  const [user_full_name, setUserFullName] = useState<string | null>(null);
  const [user_type, setUserType] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) navigate("/login");
      else {
        const user_infos = await getUserByEmail(
          data.session.user.email as string
        );

        if (user_infos !== null) {
          setUserFullName(user_infos.fam_nme ? user_infos.fam_nme : null);
          setUserType(user_infos.type ? user_infos.type : null);
        }
      }
    };
    getSession();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
                  Mr. {user_full_name}
                </label>
                <label className="text-orange-200 text-center mb-1.5">
                  - {user_type} -
                </label>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="bg-stone-700 hover:bg-stone-500 p-1 rounded-md flex justify-center items-center w-24"
                  >
                    Menu
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
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
