"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Copy,
  Download,
  Crown,
  Mail,
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateSummary, type SummaryResult } from "./actions/summarize"
import { createCheckoutSession } from "./actions/stripe"
import { SkeletonResult } from "@/components/skeleton-result"
import { InfoBox } from "@/components/info-box"
import {
  getUsageData,
  incrementUsage,
  canUseService,
  isPremiumActive,
  revokePremium,
  redeemCode,
} from "../utils/usageTracker"

export default function Home() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [template, setTemplate] = useState<"auto" | "meeting" | "email" | "project">("auto")
  const [usageData, setUsageData] = useState(getUsageData())
  const { toast } = useToast()

  // Lisää tilamuuttujat komponenttiin
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState("")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Tarkista premium-status ja käyttöoikeudet sivun latautuessa
  useEffect(() => {
    const checkAndUpdatePremiumStatus = async () => {
      const data = getUsageData()
      setUsageData(data)

      // Jos on customerId, tarkista Stripestä onko tilaus vielä aktiivinen
      if (data.customerId && data.isPremium) {
        try {
          const response = await fetch("/api/check-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: data.customerId }),
          })

          const result = await response.json()

          if (!result.hasActiveSubscription) {
            // Tilaus ei ole enää aktiivinen, poista premium
            revokePremium()
            setUsageData(getUsageData())
            toast({
              title: "Premium vanhentunut",
              description: "Tilauksen maksu on myöhässä. Premium-ominaisuudet poistettu käytöstä.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to check subscription status:", error)
        }
      }
    }

    checkAndUpdatePremiumStatus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  const handlePurchase = async () => {
    try {
      const { url, error } = await createCheckoutSession()
      if (error) {
        toast({
          title: "Virhe",
          description: error,
          variant: "destructive",
        })
        return
      }
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error("Checkout error:", err)
      toast({
        title: "Virhe",
        description: "Maksujärjestelmässä tapahtui virhe",
        variant: "destructive",
      })
    }
  }

  // Lisää funktio koodin lunastamiseen
  const handleRedeemCode = async () => {
    if (!redemptionCode.trim()) {
      toast({
        title: "Virhe",
        description: "Syötä koodi ensin",
        variant: "destructive",
      })
      return
    }

    setIsRedeeming(true)
    try {
      const result = await redeemCode(redemptionCode)

      if (result.success) {
        toast({
          title: "Onnistui! 🎉",
          description: "Premium-ominaisuudet aktivoitu onnistuneesti!",
        })
        setCodeDialogOpen(false)
        setUsageData(getUsageData()) // Päivitä käyttötiedot
      } else {
        toast({
          title: "Virhe",
          description: result.message || "Koodin lunastus epäonnistui",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Code redemption error:", error)
      toast({
        title: "Virhe",
        description: "Koodin lunastuksessa tapahtui virhe",
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({
        title: "Virhe",
        description: "Syötä teksti ensin",
        variant: "destructive",
      })
      return
    }

    // Tarkista käyttöoikeudet
    const { allowed, remaining } = canUseService()
    if (!allowed) {
      toast({
        title: "Käyttöraja täynnä",
        description: "Olet käyttänyt kaikki 3 ilmaista yhteenvetoa tänään. Hanki Premium jatkaaksesi!",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const summaryResult = await generateSummary(text, template)
      setResult(summaryResult)

      // Päivitä käyttölaskuri vain onnistuneen yhteenvedon jälkeen
      const newUsageData = incrementUsage()
      setUsageData(newUsageData)

      toast({
        title: "Valmis! ✨",
        description: `Yhteenveto luotu onnistuneesti. Jäljellä ${Math.max(0, 3 - newUsageData.count)} ilmaista yhteenvetoa tänään.`,
      })
    } catch (error) {
      console.error("Summary generation failed:", error)

      // Tarkempi virheilmoitus
      const errorMessage = error instanceof Error ? error.message : "Yhteenvedon luominen epäonnistui. Yritä uudelleen."

      toast({
        title: "Virhe",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Kopioitu! 📋",
      description: "Sisältö kopioitu leikepöydälle",
    })
  }

  const handleDownload = () => {
    if (!result) return

    const content = `YHTEENVETO
${result.summary}

TÄRKEIMMÄT ASIAT
${result.keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

TOIMENPITEET
${result.actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

${
  result.deadlines && result.deadlines.length > 0
    ? `DEADLINET
${result.deadlines.map((d, i) => `${i + 1}. ${d.task} (${d.person}, ${d.deadline})`).join("\n")}

`
    : ""
}

${
  result.pendingDecisions && result.pendingDecisions.length > 0
    ? `AVOIMET PÄÄTÖKSET
${result.pendingDecisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

`
    : ""
}

${
  result.responseTemplate
    ? `VASTAUSLUONNOS
${result.responseTemplate}`
    : ""
}

---
Luotu Summari.fi:ssä ${new Date().toLocaleDateString("fi-FI")}
`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `summari-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Ladattu! 📁",
      description: "Yhteenveto ladattu tiedostona",
    })
  }

  const getContentTypeIcon = (type?: string) => {
    switch (type) {
      case "meeting":
        return <Users className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "project":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (type?: string) => {
    switch (type) {
      case "meeting":
        return "Kokous"
      case "email":
        return "Sähköposti"
      case "project":
        return "Projekti"
      default:
        return "Yleinen"
    }
  }

  const getPriorityColor = (priority?: string) => {
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

  const { allowed, remaining } = canUseService()
  const isPremium = isPremiumActive()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with improved semantic structure */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-3 shadow-lg">
              <FileText className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 ml-3">
              Summari
              <span className="text-2xl ml-2" role="img" aria-label="Suomen lippu">
                🇫🇮
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla. Täysin suomeksi.
          </p>
        </header>

        {/* Info Box */}
        <InfoBox />

        {/* Usage indicator */}
        {!isPremium && (
          <section
            className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200"
            aria-labelledby="usage-heading"
          >
            <h2 id="usage-heading" className="sr-only">
              Käyttötilanne
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex gap-1"
                  role="progressbar"
                  aria-valuenow={usageData.count}
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-label="Käytetyt yhteenvedot"
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i <= usageData.count ? "bg-blue-500" : "bg-gray-200"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{remaining} ilmaista yhteenvetoa jäljellä tänään</span>
              </div>
              {remaining === 0 && (
                <Button onClick={handlePurchase} size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600">
                  <Crown className="h-4 w-4 mr-2" aria-hidden="true" />
                  Hanki Unlimited
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Main input area */}
        <main>
          <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl" id="input-heading">
                  Syötä teksti
                </CardTitle>
                <Select
                  value={template}
                  onValueChange={(value: any) => setTemplate(value)}
                  aria-label="Valitse tekstin tyyppi"
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Automaatti</SelectItem>
                    <SelectItem value="meeting">👥 Kokous</SelectItem>
                    <SelectItem value="email">📧 Sähköposti</SelectItem>
                    <SelectItem value="project">📋 Projekti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Liitä tähän kokousmuistio, sähköposti, dokumentti tai mikä tahansa teksti jonka haluat tiivistää..."
                className="min-h-[200px] text-base leading-relaxed resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                value={text}
                onChange={handleInputChange}
                aria-labelledby="input-heading"
                aria-describedby="char-count"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500" id="char-count" aria-live="polite">
                  {text.length > 0 && `${text.length} merkkiä`}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !text.trim() || !allowed}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 text-base font-medium"
                  aria-describedby={!allowed ? "usage-limit-message" : undefined}
                >
                  {isLoading ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                        aria-hidden="true"
                      />
                      Analysoidaan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                      Luo yhteenveto
                    </>
                  )}
                </Button>
              </div>
              {!allowed && (
                <div id="usage-limit-message" className="text-sm text-red-600" role="alert">
                  Päivittäinen käyttöraja täynnä. Hanki Premium jatkaaksesi.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading skeleton */}
          {isLoading && (
            <section aria-label="Ladataan yhteenvetoa" aria-live="polite">
              <SkeletonResult />
            </section>
          )}

          {/* Results */}
          {result && !isLoading && (
            <section aria-labelledby="results-heading">
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl" id="results-heading">
                        Yhteenveto
                      </CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getContentTypeIcon(result.contentType)}
                        {getContentTypeLabel(result.contentType)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(result.summary)}
                        aria-label="Kopioi yhteenveto"
                      >
                        <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                        Kopioi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        aria-label="Lataa yhteenveto tiedostona"
                      >
                        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                        Lataa
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <section aria-labelledby="summary-heading">
                    <h3 id="summary-heading" className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                      Tiivistelmä
                    </h3>
                    <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
                      {result.summary}
                    </p>
                  </section>

                  <Separator />

                  <Tabs defaultValue="keypoints" className="w-full">
                    <TabsList className="grid w-full grid-cols-4" role="tablist">
                      <TabsTrigger value="keypoints">Tärkeimmät</TabsTrigger>
                      <TabsTrigger value="actions">Toimenpiteet</TabsTrigger>
                      <TabsTrigger value="deadlines">Deadlinet</TabsTrigger>
                      <TabsTrigger value="decisions">Päätökset</TabsTrigger>
                    </TabsList>

                    <TabsContent value="keypoints" className="space-y-3 mt-4" role="tabpanel">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                        Tärkeimmät asiat
                      </h3>
                      <ol className="space-y-2" role="list">
                        {result.keyPoints.map((point, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                          >
                            <div
                              className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium"
                              aria-hidden="true"
                            >
                              {index + 1}
                            </div>
                            <p className="text-gray-700 leading-relaxed">{point}</p>
                          </li>
                        ))}
                      </ol>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-3 mt-4" role="tabpanel">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" aria-hidden="true" />
                        Toimenpiteet
                      </h3>
                      <ol className="space-y-2" role="list">
                        {result.actionItems.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                          >
                            <div
                              className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium"
                              aria-hidden="true"
                            >
                              {index + 1}
                            </div>
                            <p className="text-gray-700 leading-relaxed">{item}</p>
                          </li>
                        ))}
                      </ol>
                    </TabsContent>

                    <TabsContent value="deadlines" className="space-y-3 mt-4" role="tabpanel">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-red-600" aria-hidden="true" />
                        Deadlinet ja vastuuhenkilöt
                      </h3>
                      {result.deadlines && result.deadlines.length > 0 ? (
                        <ol className="space-y-2" role="list">
                          {result.deadlines.map((deadline, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                            >
                              <div
                                className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium"
                                aria-hidden="true"
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed mb-2">{deadline.task}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-gray-600">
                                    👤 {deadline.person}
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-600">
                                    📅 {deadline.deadline}
                                  </Badge>
                                  {deadline.priority && (
                                    <Badge className={getPriorityColor(deadline.priority)}>
                                      {deadline.priority === "high"
                                        ? "🔴 Kiireellinen"
                                        : deadline.priority === "medium"
                                          ? "🟡 Normaali"
                                          : "🟢 Matala"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                          Ei tunnistettuja deadlineja tai vastuuhenkilöitä.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="decisions" className="space-y-3 mt-4" role="tabpanel">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-purple-600" aria-hidden="true" />
                        Avoimet päätökset
                      </h3>
                      {result.pendingDecisions && result.pendingDecisions.length > 0 ? (
                        <ol className="space-y-2" role="list">
                          {result.pendingDecisions.map((decision, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                            >
                              <div
                                className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium"
                                aria-hidden="true"
                              >
                                {index + 1}
                              </div>
                              <p className="text-gray-700 leading-relaxed">{decision}</p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                          Ei avoimia päätöksiä tunnistettu.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Response template for emails */}
                  {result.responseTemplate && (
                    <>
                      <Separator />
                      <section aria-labelledby="response-heading">
                        <h3 id="response-heading" className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Mail className="h-5 w-5 text-blue-600" aria-hidden="true" />
                          Vastausluonnos
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                            {result.responseTemplate}
                          </pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleCopyToClipboard(result.responseTemplate!)}
                            aria-label="Kopioi vastausluonnos"
                          >
                            <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                            Kopioi vastaus
                          </Button>
                        </div>
                      </section>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </main>

        {/* Purchase section for non-premium users */}
        {!isPremium && (
          <aside className="text-center pt-8 border-t border-gray-200 mt-8" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="sr-only">
              Premium-tilaus
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Tarvitset enemmän yhteenvetoja?</h3>
              <p className="text-lg text-gray-600 mb-4">
                Unlimited-tilaus = rajaton käyttö + kaikki premium-ominaisuudet
              </p>
              <Button
                onClick={handlePurchase}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 text-lg font-medium mb-4"
              >
                <Crown className="h-5 w-5 mr-2" aria-hidden="true" />
                Hanki Unlimited - 19€/kk
              </Button>
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCodeDialogOpen(true)
                    // Fokusoi input-kenttään kun dialogi aukeaa
                    setTimeout(() => {
                      if (codeInputRef.current) {
                        codeInputRef.current.focus()
                      }
                    }, 100)
                  }}
                  className="text-amber-600 hover:text-amber-700"
                >
                  Minulla on koodi
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white/80 rounded-lg border border-green-200">
                <div className="text-green-600 text-2xl mb-2" aria-hidden="true">
                  ⚡
                </div>
                <h4 className="font-semibold mb-1">Rajaton käyttö</h4>
                <p className="text-sm text-gray-600">Niin monta yhteenvetoa kuin tarvitset</p>
              </div>
              <div className="p-4 bg-white/80 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-2xl mb-2" aria-hidden="true">
                  🚀
                </div>
                <h4 className="font-semibold mb-1">Nopeampi prosessointi</h4>
                <p className="text-sm text-gray-600">Prioriteettijono ja parempi suorituskyky</p>
              </div>
              <div className="p-4 bg-white/80 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-2xl mb-2" aria-hidden="true">
                  📁
                </div>
                <h4 className="font-semibold mb-1">Lataa tiedostona</h4>
                <p className="text-sm text-gray-600">Tallenna yhteenvedot .txt-muodossa</p>
              </div>
            </div>

            <address className="text-xs text-gray-500 not-italic">
              💼 Laskutus tai yrityskäyttö? Ota yhteyttä:
              <a href="mailto:tuki@summari.fi" className="underline hover:text-gray-700 ml-1">
                tuki@summari.fi
              </a>
            </address>
          </aside>
        )}

        {/* Koodi-dialogi */}
        <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lunasta koodi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">Syötä aktivointikoodi saadaksesi premium-ominaisuudet käyttöön.</p>
              <Input
                ref={codeInputRef}
                placeholder=""
                value={redemptionCode}
                onChange={(e) => setRedemptionCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRedeemCode()
                  }
                }}
                aria-label="Aktivointikoodi"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
                Peruuta
              </Button>
              <Button
                onClick={handleRedeemCode}
                disabled={isRedeeming || !redemptionCode.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isRedeeming ? (
                  <>
                    <div
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                      aria-hidden="true"
                    />
                    Tarkistetaan...
                  </>
                ) : (
                  "Lunasta"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback section with emoji reactions */}
      {/* Simple feedback */}
      <div className="text-center mt-12 mb-8 p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-3">
          <strong>Mitä jäit kaipaamaan?</strong> Kerro meille:
          <a
            href="mailto:tuki@summari.fi?subject=Kehitysehdotus&body=Hei! Toivoisin Summariin seuraavaa ominaisuutta:"
            className="text-blue-600 hover:underline ml-1"
          >
            tuki@summari.fi
          </a>
        </p>
      </div>

      <Toaster />
    </div>
  )
}
