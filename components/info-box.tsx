import { Card, CardContent } from "@/components/ui/card"
import { Clock, FileText, CheckCircle, Sparkles } from "lucide-react"

export function InfoBox() {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 p-1 rounded-xl shadow-xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Miksi Summari?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Summari muuttaa pitkät tekstit selkeiksi toimintasuunnitelmiksi sekunneissa. Säästä aikaa ja keskity
                olennaiseen.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border border-blue-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Säästä aikaa</h3>
            <p className="text-sm text-gray-600">
              Ei enää tuntien lukemista - saat olennaiset asiat selville sekunneissa.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-green-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Selkeät toimenpiteet</h3>
            <p className="text-sm text-gray-600">Tunnistaa automaattisesti tehtävät, deadlinet ja vastuuhenkilöt.</p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Älykkäät yhteenvedot</h3>
            <p className="text-sm text-gray-600">Tunnistaa automaattisesti sisällön tyypin ja optimoi analyysin.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
