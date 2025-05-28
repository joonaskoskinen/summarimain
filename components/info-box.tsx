import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Target, Zap, Brain } from "lucide-react"

export function InfoBox() {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 p-1 rounded-xl shadow-xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Miksi Summari?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Summari muuttaa pitkät tekstit suoraan toimintasuunnitelmiksi. Ei enää tuntien lukemista - saat
                vastuuhenkilöt, deadlinet ja seuraavat askeleet valmiina sekunneissa.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border border-green-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Sekunneissa valmis</h3>
            <p className="text-sm text-gray-600">Syötä teksti, saat toimintasuunnitelman. Ei säätöä, ei promptailua.</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Suoraan toimintaan</h3>
            <p className="text-sm text-gray-600">Vastuuhenkilöt, deadlinet ja tehtävät automaattisesti poimittuna.</p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Ymmärtää suomea</h3>
            <p className="text-sm text-gray-600">Ei käännöksiä tai kikkailua - suoraan suomeksi sisään ja ulos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
