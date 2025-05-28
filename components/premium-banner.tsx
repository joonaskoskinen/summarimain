"use client"

import type React from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface PremiumBannerProps {
  onClose: () => void
}

const PremiumBanner: React.FC<PremiumBannerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-r from-amber-500 to-amber-400 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-lg font-semibold mr-4">Hanki Unlimited!</span>
          <p className="text-sm">Nauti rajoittamattomasta käytöstä.</p>
        </div>
        <div className="flex items-center">
          <button
            className="bg-white text-amber-500 hover:bg-amber-100 font-semibold py-2 px-4 rounded mr-4"
            onClick={() => {
              window.location.href = "https://buy.stripe.com/6sIeX8cNq1YJg0UaEF"
            }}
          >
            Päivitä
          </button>
          <button onClick={onClose} className="text-white hover:text-amber-100 focus:outline-none">
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="container mx-auto mt-2">
        <details className="group">
          <summary className="flex items-center font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
            <span className="text-sm text-white mr-1">Mitä Premium sisältää?</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 ml-1 group-open:rotate-180 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="mt-2 text-sm text-white">
            <ul>
              <li>✅ Rajoittamaton määrä tiivistelmiä</li>
              <li>✅ Ei mainoksia</li>
              <li>✅ Nopeampi prosessointi</li>
              <li>✅ Tuki kehitykselle</li>
            </ul>
          </div>
        </details>
      </div>
      <div className="container mx-auto mt-2">
        <details className="group">
          <summary className="flex items-center font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
            <span className="text-sm text-white mr-1">Lunasta koodi</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 ml-1 group-open:rotate-180 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="mt-2 text-sm text-white">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const code = (document.getElementById("code") as HTMLInputElement).value
                fetch("/api/redeem", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ code }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      alert("Koodi lunastettu onnistuneesti! Päivitä sivu.")
                      window.location.reload()
                    } else {
                      alert("Virhe: " + data.message)
                    }
                  })
              }}
            >
              <label htmlFor="code" className="block text-sm font-medium text-white">
                Koodi:
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="code"
                  id="code"
                  className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md text-black"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-amber-500 hover:bg-amber-100 font-semibold py-2 px-4 rounded mt-2"
              >
                Lunasta
              </button>
            </form>
            <p className="text-sm text-amber-700 mb-3">Ei koodia? Hanki Unlimited-tilaus:</p>
            <p className="text-xs text-amber-600 mb-3">
              💼 Laskutus tai yrityskäyttö? Ota yhteyttä:
              <a href="mailto:summariapp@gmail.com" className="underline hover:text-amber-800 ml-1">
                summariapp@gmail.com
              </a>
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}

export default PremiumBanner
