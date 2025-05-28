import { type NextRequest, NextResponse } from "next/server"

// Koodit environment variablesta tai tietokannasta
// Tuotannossa nämä tulisivat tietokannasta käytettyjen koodien seurantaa varten
const getValidCodes = () => {
  // Environment variablesta pilkulla erotettu lista
  const envCodes = process.env.VALID_REDEMPTION_CODES || ""
  return envCodes
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
}

// Vaihtoehtoisesti voit käyttää kovakoodattuja koodeja vain serverillä
const HARDCODED_CODES = ["SUMMARI2024", "KOSKELO123", "TESTCODE"]

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ success: false, message: "Koodi puuttuu" }, { status: 400 })
    }

    // Hae koodit environment variablesta tai käytä kovakoodattuja
    const validCodes = process.env.VALID_REDEMPTION_CODES ? getValidCodes() : HARDCODED_CODES

    // Tarkista onko koodi validi (case-insensitive)
    const isValid = validCodes.some((validCode) => validCode.toLowerCase() === code.toLowerCase())

    if (isValid) {
      // Tuotannossa tässä merkittäisiin koodi käytetyksi tietokantaan
      console.log(`Koodi lunastettu: ${code}`)

      return NextResponse.json({
        success: true,
        message: "Koodi hyväksytty!",
        expiryDays: 30, // Koodin voimassaoloaika päivissä
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Virheellinen koodi",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Code redemption error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Koodin lunastuksessa tapahtui virhe",
      },
      { status: 500 },
    )
  }
}
