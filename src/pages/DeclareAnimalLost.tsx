import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";

export default function DeclareAnimalLost() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Déclarer un animal perdu
          </h1>
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Animal Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="animalName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom de l'animal
                </label>
                <input
                  type="text"
                  id="animalName"
                  name="animalName"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ex: Médor"
                />
              </div>

              {/* Animal Type */}
              <div>
                <label
                  htmlFor="animalType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type d'animal
                </label>
                <select
                  id="animalType"
                  name="animalType"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option>Chien</option>
                  <option>Chat</option>
                  <option>Oiseau</option>
                  <option>Autre</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label
                  htmlFor="breed"
                  className="block text-sm font-medium text-gray-700"
                >
                  Race
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ex: Berger Allemand"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Signes particuliers, couleur, taille, etc."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 text-center">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Soumettre la déclaration
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
