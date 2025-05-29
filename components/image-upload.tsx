"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, X, FileText, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  onTextExtracted: (text: string) => void
  isLoading: boolean
  isPremium: boolean
}

export function ImageUpload({ onTextExtracted, isLoading, isPremium }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Tarkista tiedostotyyppi
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Virhe",
        description: "Valitse kuvatiedosto (JPG, PNG, WebP)",
        variant: "destructive",
      })
      return
    }

    // Tarkista koko (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Virhe",
        description: "Kuva on liian suuri. Maksimikoko 5MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setSelectedImage(result)
    }
    reader.readAsDataURL(file)
  }

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

    try {
      // Lataa Tesseract.js dynaamisesti
      const Tesseract = await import("tesseract.js")

      toast({
        title: "Tunnistetaan tekstiä...",
        description: "Tämä voi kestää hetken",
      })

      const {
        data: { text },
      } = await Tesseract.recognize(
        selectedImage,
        "fin+eng", // Suomi ja englanti
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              // Voit näyttää edistymisen jos haluat
              console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
            }
          },
        },
      )

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
          toast({
            title: "Vähän tekstiä tunnistettu",
            description: "Kokeile selkeämpää kuvaa tai syötä teksti käsin",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Tekstiä ei tunnistettu",
          description: "Kokeile selkeämpää kuvaa tai syötä teksti käsin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("OCR error:", error)
      toast({
        title: "Tekstintunnistus epäonnistui",
        description: "Kokeile toista kuvaa tai syötä teksti käsin",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors mb-8">
      <CardContent className="p-6">
        {!selectedImage ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Tunnista teksti kuvasta {!isPremium && "🔒"}</h3>
            <p className="text-gray-600 mb-4">
              {isPremium
                ? "Lataa kuva dokumentista, muistiinpanoista tai kokoustaulusta"
                : "Tekstintunnistus on saatavilla Unlimited-käyttäjille"}
            </p>

            {isPremium && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                <Eye className="h-4 w-4 inline mr-2" />
                <strong>Näin se toimii:</strong> Tunnistamme tekstin kuvasta ja lisäämme sen automaattisesti ylempään
                tekstikenttään. Sitten voit luoda yhteenvedon normaalisti!
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
              className={isPremium ? "hover:bg-blue-50" : "opacity-50"}
            >
              <Upload className="h-4 w-4 mr-2" />
              Valitse kuva
            </Button>
            {!isPremium && (
              <p className="text-xs text-amber-600 mt-2">Hanki Unlimited käyttääksesi tekstintunnistusta</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Valittu kuva"
                className="max-w-full h-auto max-h-64 mx-auto rounded-lg border"
              />
              <Button variant="outline" size="sm" onClick={clearImage} className="absolute top-2 right-2 bg-white/90">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
              <FileText className="h-4 w-4 inline mr-2" />
              <strong>Valmis tunnistukseen!</strong> Painamalla "Tunnista teksti" lisäämme kuvasta löytyvän tekstin
              automaattisesti alempaan tekstikenttään.
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={extractTextFromImage}
                disabled={isExtracting || isLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600"
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
              <Button variant="outline" onClick={clearImage}>
                Vaihda kuva
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
