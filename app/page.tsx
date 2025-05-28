"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { getUsageData, incrementUsage, canUseService, isPremiumActive, revokePremium } from "../utils/usageTracker"

export default function Home() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [template, setTemplate] = useState<"auto" | "meeting" | "email" | "project">("auto")
  const [usageData, setUsageData] = useState(getUsageData())
  const { toast } = useToast()

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

${result.deadlines && result.deadlines.length > 0 ? `DEADLINET\n${result.deadlines.map((d, i) => `${i + 1}. ${d.task} (${d.person}, ${d.deadline})`).join("\n")}\n\n` : ""}

${result.pendingDecisions && result.pendingDecisions.length > 0 ? `AVOIMET PÄÄTÖKSET\n${result.pendingDecisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\n` : ""}

${result.responseTemplate ? `VASTAUSLUONNOS\n${result.responseTemplate}` : ""}

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-3 shadow-lg">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 ml-3">
              Summari
              <span className="text-2xl ml-2">🇫🇮</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Muuta pitkät tekstit toimintasuunnitelmiksi AI:n avulla. Täysin suomeksi.
          </p>
        </div>

        {/* Info Box */}
        <InfoBox />

        {/* Usage indicator */}
        {!isPremium && (
          <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i <= usageData.count ? "bg-blue-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{remaining} ilmaista yhteenvetoa jäljellä tänään</span>
              </div>
              {remaining === 0 && (
                <Button onClick={handlePurchase} size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600">
                  <Crown className="h-4 w-4 mr-2" />
                  Hanki Unlimited
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main input area */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Syötä teksti</CardTitle>
              <Select value={template} onValueChange={(value: any) => setTemplate(value)}>
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
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">{text.length > 0 && `${text.length} merkkiä`}</div>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !text.trim() || !allowed}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analysoidaan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Luo yhteenveto
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {isLoading && <SkeletonResult />}

        {/* Results */}
        {result && !isLoading && (
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">Yhteenveto</CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getContentTypeIcon(result.contentType)}
                    {getContentTypeLabel(result.contentType)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(result.summary)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopioi
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Lataa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Tiivistelmä
                </h3>
                <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
                  {result.summary}
                </p>
              </div>

              <Separator />

              <Tabs defaultValue="keypoints" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="keypoints">Tärkeimmät</TabsTrigger>
                  <TabsTrigger value="actions">Toimenpiteet</TabsTrigger>
                  <TabsTrigger value="deadlines">Deadlinet</TabsTrigger>
                  <TabsTrigger value="decisions">Päätökset</TabsTrigger>
                </TabsList>

                <TabsContent value="keypoints" className="space-y-3 mt-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Tärkeimmät asiat
                  </h3>
                  <div className="space-y-2">
                    {result.keyPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-3 mt-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Toimenpiteet
                  </h3>
                  <div className="space-y-2">
                    {result.actionItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="deadlines" className="space-y-3 mt-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    Deadlinet ja vastuuhenkilöt
                  </h3>
                  {result.deadlines && result.deadlines.length > 0 ? (
                    <div className="space-y-2">
                      {result.deadlines.map((deadline, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                      Ei tunnistettuja deadlineja tai vastuuhenkilöitä.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="decisions" className="space-y-3 mt-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                    Avoimet päätökset
                  </h3>
                  {result.pendingDecisions && result.pendingDecisions.length > 0 ? (
                    <div className="space-y-2">
                      {result.pendingDecisions.map((decision, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed">{decision}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">Ei avoimia päätöksiä tunnistettu.</p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Response template for emails */}
              {result.responseTemplate && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
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
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Kopioi vastaus
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Purchase section for non-premium users */}
        {!isPremium && (
          <div className="text-center pt-8 border-t border-gray-200 mt-8">
            <p className="text-lg text-gray-600 mb-4">Tarvitset enemmän yhteenvetoja?</p>
            <Button
              onClick={handlePurchase}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 text-lg font-medium mb-4"
            >
              <Crown className="h-5 w-5 mr-2" />
              Hanki Unlimited - 19€/kk
            </Button>
            <p className="text-sm text-gray-500 mb-3">
              ✅ Rajaton määrä yhteenvetoja • ✅ Ei mainoksia • ✅ Nopeampi prosessointi
            </p>
            <p className="text-xs text-gray-500">
              💼 Laskutus tai yrityskäyttö? Ota yhteyttä:
              <a href="mailto:summariapp@gmail.com" className="underline hover:text-gray-700 ml-1">
                summariapp@gmail.com
              </a>
            </p>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}
