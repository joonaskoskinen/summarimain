"use server"

import type { SummaryResult } from "./summarize"

export async function analyzeImage(imageData: string): Promise<SummaryResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("AI-palvelu ei ole käytettävissä")
  }

  try {
    // First, let's try to extract text using a simpler approach
    // Since Groq might not support vision models, we'll use a text-based fallback

    console.log("Starting image analysis...")

    // Check if the image data is valid
    if (!imageData.startsWith("data:image/")) {
      throw new Error("Virheellinen kuvamuoto")
    }

    // For now, let's implement a fallback that asks the user to describe the image
    // This is a temporary solution until we can confirm Groq's vision capabilities

    const fallbackPrompt = `Käyttäjä on ladannut kuvan analysoitavaksi. Koska kuva-analyysi ei ole vielä täysin toiminnassa, 
    luo esimerkki-yhteenveto joka neuvoo käyttäjää:

    1. Kuvaamaan kuvan sisällön tekstinä
    2. Syöttämään tekstin tavalliseen analyysiin
    3. Tai odottamaan kuva-analyysin parannuksia

    Vastaa JSON-muodossa:
    {
      "contentType": "general",
      "summary": "Kuva-analyysi on kehitteillä. Kuvaa kuvan sisältö tekstinä ja syötä se tavalliseen analyysiin.",
      "keyPoints": [
        "Kuva-analyysi on premium-ominaisuus kehitteillä",
        "Voit kuvata kuvan sisällön tekstinä",
        "Syötä teksti tavalliseen analyysiin saadaksesi yhteenvedon"
      ],
      "actionItems": [
        "Kuvaa kuvan sisältö tekstinä",
        "Syötä teksti pääsivun tekstikenttään",
        "Luo yhteenveto tavallisella tavalla"
      ],
      "pendingDecisions": ["Kuva-analyysin tekninen toteutus"],
      "responseTemplate": null
    }`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Use the standard text model
        messages: [{ role: "user", content: fallbackPrompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API error:", response.status, errorText)
      throw new Error(`API-virhe: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("Ei vastausta AI:lta")
    }

    const text = data.choices[0].message.content

    // Parse JSON response
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    const firstBrace = cleanedText.indexOf("{")
    if (firstBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace)
    }

    const lastBrace = cleanedText.lastIndexOf("}")
    if (lastBrace !== -1) {
      cleanedText = cleanedText.substring(0, lastBrace + 1)
    }

    const parsed = JSON.parse(cleanedText)

    return {
      contentType: parsed.contentType || "general",
      summary: parsed.summary || "Kuva-analyysi on kehitteillä",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : ["Kuva-analyysi kehitteillä"],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : ["Kuvaa kuva tekstinä"],
      deadlines: parsed.deadlines,
      pendingDecisions: parsed.pendingDecisions,
      responseTemplate: parsed.responseTemplate,
    }
  } catch (error) {
    console.error("Image analysis error details:", error)

    // Return a helpful error response instead of throwing
    return {
      contentType: "general",
      summary:
        "Kuva-analyysi on tilapäisesti pois käytöstä. Kuvaa kuvan sisältö tekstinä ja syötä se tavalliseen analyysiin.",
      keyPoints: [
        "Kuva-analyysi on kehitteillä",
        "Voit kuvata kuvan sisällön tekstinä",
        "Käytä tavallista tekstianalyysiä",
      ],
      actionItems: [
        "Kuvaa kuvan sisältö omin sanoin",
        "Syötä teksti pääsivun tekstikenttään",
        "Luo yhteenveto normaalisti",
      ],
      pendingDecisions: ["Kuva-analyysin tekninen toteutus"],
    }
  }
}
