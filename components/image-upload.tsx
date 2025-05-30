"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, X, FileText, Eye, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  onTextExtracted: (text: string) => void
  isLoading: boolean
  isPremium: boolean
}

export function ImageUpload({ onTextExtracted, isLoading, isPremium }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateAndProcessFile = useCallback(
    (file: File) => {
      // Tarkista tiedostotyyppi
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Virhe",
          description: "Valitse kuvatiedosto (JPG, PNG, WebP)",
          variant: "destructive",
        })
        return false
      }

      // Tarkista koko (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Virhe",
          description: "Kuva on liian suuri. Maksimikoko 20MB.",
          variant: "destructive",
        })
        return false
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
        setOcrError(null)
        toast({
          title: "Kuva ladattu! 📸",
          description: "Voit nyt tunnistaa tekstin kuvasta",
        })
      }
      reader.readAsDataURL(file)
      return true
    },
    [toast],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    validateAndProcessFile(file)
  }

  // Drag & Drop handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isPremium) {
        setIsDragOver(true)
      }
    },
    [isPremium],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Tarkista että hiiri todella poistui alueelta
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (!isPremium) {
        toast({
          title: "Premium-ominaisuus",
          description: "Tekstintunnistus kuvista on saatavilla vain Unlimited-käyttäjille",
          variant: "destructive",
        })
        return
      }

      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith("image/"))

      if (!imageFile) {
        toast({
          title: "Virhe",
          description: "Raahaa kuvatiedosto (JPG, PNG, WebP)",
          variant: "destructive",
        })
        return
      }

      if (files.length > 1) {
        toast({
          title: "Huomio",
          description: "Käsitellään vain ensimmäinen kuvatiedosto",
        })
      }

      validateAndProcessFile(imageFile)
    },
    [isPremium, validateAndProcessFile, toast],
  )

  const extractTextFromImage = async () => {
    if (!selectedImage) return
    if (!isPremium) {
      toast({
        title: "Premium-ominaisuus",
        description: "Tekstintunnistus kuvista on saatavilla vain Unlimited-käyttäjille",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    setOcrError(null)

    try {
      console.log("Aloitetaan OCR...")

      // Tarkista onko Tesseract.js saatavilla
      let Tesseract
      try {
        Tesseract = await import("tesseract.js")
        console.log("Tesseract.js ladattu onnistuneesti")
      } catch (importError) {
        console.error("Tesseract.js lataus epäonnistui:", importError)
        throw new Error("Tekstintunnistuskirjasto ei ole saatavilla. Yritä päivittää sivu.")
      }

      toast({
        title: "Tunnistetaan tekstiä...",
        description: "Tämä voi kestää hetken",
      })

      console.log("Aloitetaan tekstintunnistus...")

      const {
        data: { text },
      } = await Tesseract.recognize(
        selectedImage,
        "fin+eng", // Suomi ja englanti
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
            }
          },
        },
      )

      console.log("OCR valmis, tunnistettu teksti:", text.substring(0, 100) + "...")

      if (text.trim()) {
        // Siivoa teksti hieman
        const cleanedText = text
          .replace(/\n\s*\n/g, "\n\n") // Poista ylimääräiset tyhjät rivit
          .replace(/^\s+|\s+$/g, "") // Poista alku- ja loppuvälit
          .trim()

        if (cleanedText.length > 10) {
          onTextExtracted(cleanedText)
          toast({
            title: "Teksti tunnistettu! 📝",
            description: `${cleanedText.length} merkkiä tunnistettu. Tarkista teksti ja luo yhteenveto.`,
          })
          clearImage() // Piilota kuva kun teksti on tunnistettu
        } else {
          setOcrError("Vähän tekstiä tunnistettu. Kokeile selkeämpää kuvaa.")
          toast({
            title: "Vähän tekstiä tunnistettu",
            description: "Kokeile selkeämpää kuvaa tai syötä teksti käsin",
            variant: "destructive",
          })
        }
      } else {
        setOcrError("Tekstiä ei tunnistettu. Kokeile selkeämpää kuvaa.")
        toast({
          title: "Tekstiä ei tunnistettu",
          description: "Kokeile selkeämpää kuvaa tai syötä teksti käsin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("OCR error:", error)
      const errorMessage = error instanceof Error ? error.message : "Tekstintunnistus epäonnistui"
      setOcrError(errorMessage)
      toast({
        title: "Tekstintunnistus epäonnistui",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setOcrError(null)
    setIsDragOver(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isButtonDisabled = isExtracting || isLoading || !isPremium

  return (
    <Card
      className={`border-dashed border-2 transition-all duration-200 mb-8 ${
        isDragOver && isPremium
          ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg"
          : selectedImage
            ? "border-green-400 bg-green-50"
            : isPremium
              ? "border-gray-300 hover:border-blue-400"
              : "border-gray-200 opacity-75"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        {!selectedImage ? (
          <div className="text-center">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200 ${
                isDragOver && isPremium ? "bg-blue-200 scale-110" : isPremium ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <ImageIcon
                className={`h-8 w-8 transition-colors duration-200 ${
                  isDragOver && isPremium ? "text-blue-700" : isPremium ? "text-blue-600" : "text-gray-400"
                }`}
              />
            </div>

            <h3
              className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                isDragOver && isPremium ? "text-blue-700" : ""
              }`}
            >
              {isDragOver && isPremium ? "Pudota kuva tähän! 📸" : `Tunnista teksti kuvasta ${!isPremium ? "🔒" : ""}`}
            </h3>

            <p
              className={`text-gray-600 mb-4 transition-colors duration-200 ${
                isDragOver && isPremium ? "text-blue-600" : ""
              }`}
            >
              {isDragOver && isPremium
                ? "Päästä irti ladataksesi kuvan"
                : isPremium
                  ? "Raahaa kuva tähän tai klikkaa valitaksesi tiedoston"
                  : "Tekstintunnistus on saatavilla Unlimited-käyttäjille"}
            </p>

            {isPremium && !isDragOver && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                <Eye className="h-4 w-4 inline mr-2" />
                <strong>Näin se toimii:</strong> Raahaa kuva tähän tai klikkaa "Valitse kuva". Tunnistamme tekstin ja
                lisäämme sen automaattisesti alempaan tekstikenttään!
              </div>
            )}

            {isDragOver && isPremium && (
              <div className="bg-blue-100 p-4 rounded-lg mb-4 text-blue-800 border-2 border-blue-300 border-dashed">
                <Upload className="h-6 w-6 inline mr-2" />
                <strong>Valmis vastaanottamaan!</strong> Pudota kuva ladataksesi sen.
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={!isPremium}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={!isPremium}
              className={`transition-all duration-200 ${
                isPremium ? "hover:bg-blue-50 hover:border-blue-400" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Valitse kuva
            </Button>

            {!isPremium && (
              <p className="text-xs text-amber-600 mt-2">Hanki Unlimited käyttääksesi tekstintunnistusta</p>
            )}

            {isPremium && (
              <p className="text-xs text-gray-500 mt-2">Tuetut muodot: JPG, PNG, WebP • Maksimikoko: 20MB</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Valittu kuva"
                className="max-w-full h-auto max-h-64 mx-auto rounded-lg border shadow-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {ocrError && (
              <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-200">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                <strong>Virhe:</strong> {ocrError}
              </div>
            )}

            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800 border border-green-200">
              <FileText className="h-4 w-4 inline mr-2" />
              <strong>Valmis tunnistukseen!</strong> Painamalla "Tunnista teksti" lisäämme kuvasta löytyvän tekstin
              automaattisesti ylempään tekstikenttään.
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={extractTextFromImage}
                disabled={isButtonDisabled}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Tunnistetaan tekstiä...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Tunnista teksti
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearImage} className="hover:bg-gray-50">
                Vaihda kuva
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
