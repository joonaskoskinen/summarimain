"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  Crown,
  Loader2,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react"
import { generateSummary, type SummaryResult } from "./actions/summarize"
import { createCheckoutSession } from "./actions/stripe"
import { PremiumBanner } from "@/components/premium-banner"
import { canUseService, incrementUsage, isPremiumActive } from "../utils/usageTracker"

export default function SummariApp() {
  const [content, setContent] = useState("")
  const [template, setTemplate] = useState<"auto" | "meeting" | "email" | "project">("auto")
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPremiumBanner, setShowPremiumBanner] = useState(false)
  const [usageInfo, setUsageInfo] = useState({ allowed: true, remaining: 3 })
  const [isPremium, setIsPremium] = useState(false)

  // Check usage and premium status on component mount
  useEffect(() => {
    const usage = canUseService()
    const premium = isPremiumActive()
    setUsageInfo(usage)
    setIsPremium(premium)

    // Show premium banner if user has used all free summaries
    if (!premium && usage.remaining === 0) {
      setShowPremiumBanner(true)
    }
  }, [])

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Syötä teksti, josta haluat yhteenvedon")
      return
    }

    // Check if user can use the service
    const usage = canUseService()
    if (!usage.allowed) {
      setShowPremiumBanner(true)
      setError("Ilmaiset yhteenvedot loppuivat tältä päivältä. Aktivoi Unlimited-koodi tai osta tilaus.")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      // Increment usage count
      const newUsage = incrementUsage()
      setUsageInfo({ allowed: newUsage.count < 3 || isPremiumActive(), remaining: Math.max(0, 3 - newUsage.count) })

      const summary = await generateSummary(content, template)
      setResult(summary)

      // Show premium banner if this was the last free summary
      if (!isPremiumActive() && newUsage.count >= 3) {
        setShowPremiumBanner(true)
      }
    } catch (err) {
      console.error("Summary generation failed:", err)
      setError(err instanceof Error ? err.message : "Yhteenvedon luominen epäonnistui")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    try {
      const { url, error } = await createCheckoutSession()
      if (error) {
        setError(error)
        return
      }
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error("Checkout error:", err)
      setError("Maksujärjestelmässä tapahtui virhe")
    }
  }

  const downloadAsText = () => {
    if (!result) return

    const textContent = `
YHTEENVETO
${result.summary}

TÄRKEIMMÄT ASIAT
${result.keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

TOIMENPITEET
${result.actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

${
  result.deadlines && result.deadlines.length > 0
    ? `
DEADLINET
${result.deadlines.map((deadline, i) => `${i + 1}. ${deadline.task} (${deadline.person}) - ${deadline.deadline} [${deadline.priority}]`).join("\n")}
`
    : ""
}

${
  result.pendingDecisions && result.pendingDecisions.length > 0
    ? `
AVOIMET PÄÄTÖKSET
${result.pendingDecisions.map((decision, i) => `${i + 1}. ${decision}`).join("\n")}
`
    : ""
}

${
  result.responseTemplate
    ? `
VASTAUSLUONNOS
${result.responseTemplate}
`
    : ""
}

Luotu Summari.fi:ssä ${new Date().toLocaleDateString("fi-FI")}
    `.trim()

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `summari-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePremiumActivated = () => {
    setShowPremiumBanner(false)
    setIsPremium(true)
    setUsageInfo({ allowed: true, remaining: -1 })
    setError("")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Summari
            </h1>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Unlimited
              </Badge>
            )}
          </div>
          <p className="text-xl text-gray-600 mb-2">Älykkäät yhteenvedot suomeksi</p>
          <p className="text-gray-500">Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla</p>

          {/* Usage indicator */}
          {!isPremium && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Ilmaiset yhteenvedot tänään</span>
                <span>{usageInfo.remaining}/3</span>
              </div>
              <Progress value={(usageInfo.remaining / 3) * 100} className="h-2" />
            </div>
          )}
        </div>

        {/* Premium Banner */}
        {showPremiumBanner && (
          <div className="mb-6">
            <PremiumBanner
              remaining={usageInfo.remaining}
              onPremiumActivated={handlePremiumActivated}
              onClose={() => setShowPremiumBanner(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-blue-600" />
                Syötä teksti
              </CardTitle>
              <CardDescription>
                Liitä kokousmuistio, sähköposti tai muu teksti, josta haluat yhteenvedon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valitse malli (valinnainen):</label>
                <Select
                  value={template}
                  onValueChange={(value: "auto" | "meeting" | "email" | "project") => setTemplate(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Automaattinen tunnistus</SelectItem>
                    <SelectItem value="meeting">👥 Kokousmuistio</SelectItem>
                    <SelectItem value="email">📧 Sähköposti</SelectItem>
                    <SelectItem value="project">📋 Projektisuunnitelma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Liitä tähän teksti, josta haluat yhteenvedon... (vähintään 10 merkkiä)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{content.length} merkkiä</span>
                {content.length < 10 && content.length > 0 && (
                  <span className="text-amber-600">Vähintään 10 merkkiä tarvitaan</span>
                )}
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading || content.length < 10 || (!usageInfo.allowed && !isPremium)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Luodaan yhteenvetoa...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Luo yhteenveto
                  </>
                )}
              </Button>

              {!isPremium && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Tarvitset enemmän yhteenvetoja?</p>
                  <Button
                    onClick={handlePurchase}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Hanki Unlimited - 19€/kk
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Yhteenveto
                </CardTitle>
                {result && (isPremium || true) && (
                  <Button
                    onClick={downloadAsText}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Lataa .txt
                  </Button>
                )}
              </div>
              <CardDescription>AI-generoitu analyysi ja toimintasuunnitelma</CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !isLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Valmis analysoimaan</p>
                  <p>Syötä teksti vasemmalle ja paina "Luo yhteenveto"</p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Analysoidaan tekstiä...</p>
                  <p className="text-gray-500">Tämä kestää muutaman sekunnin</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Content Type Badge */}
                  {result.contentType && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-700 border-blue-200">
                        Tunnistettu:{" "}
                        {result.contentType === "meeting"
                          ? "👥 Kokous"
                          : result.contentType === "email"
                            ? "📧 Sähköposti"
                            : result.contentType === "document"
                              ? "📄 Dokumentti"
                              : "📝 Yleinen teksti"}
                      </Badge>
                    </div>
                  )}

                  {/* Summary */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Yhteenveto
                    </h3>
                    <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
                      {result.summary}
                    </p>
                  </div>

                  <Separator />

                  {/* Key Points */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Tärkeimmät asiat
                    </h3>
                    <ul className="space-y-2">
                      {result.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Action Items */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-orange-600" />
                      Toimenpiteet
                    </h3>
                    <ul className="space-y-2">
                      {result.actionItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deadlines */}
                  {result.deadlines && result.deadlines.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          Deadlinet ja vastuuhenkilöt
                        </h3>
                        <div className="space-y-3">
                          {result.deadlines.map((deadline, index) => (
                            <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{deadline.task}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {deadline.person}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {deadline.deadline}
                                    </span>
                                  </div>
                                </div>
                                <Badge className={`${getPriorityColor(deadline.priority || "medium")} border`}>
                                  {deadline.priority === "high"
                                    ? "Kiireellinen"
                                    : deadline.priority === "low"
                                      ? "Matala"
                                      : "Keskitaso"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pending Decisions */}
                  {result.pendingDecisions && result.pendingDecisions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Avoimet päätökset
                        </h3>
                        <ul className="space-y-2">
                          {result.pendingDecisions.map((decision, index) => (
                            <li
                              key={index}
                              className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-gray-700"
                            >
                              {decision}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Response Template */}
                  {result.responseTemplate && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Vastausluonnos
                        </h3>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <pre className="whitespace-pre-wrap text-gray-700 font-sans">{result.responseTemplate}</pre>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Summari.fi - Tekoäly-avusteinen tekstianalyysi suomeksi</p>
          <p className="mt-1">Tietosuoja ja käyttöehdot noudattavat EU:n GDPR-säädöstä</p>
        </div>
      </div>
    </div>
  )
}

const priorityOrder: { [key: string]: number } = {
  high: 0,
  medium: 1,
  low: 2,
}

function sortDeadlines(deadlines: any[]) {
  return [...deadlines].sort((a, b) => {
    return (priorityOrder[b.priority || "medium"] || 2) - (priorityOrder[a.priority || "medium"] || 2)
  })
}
