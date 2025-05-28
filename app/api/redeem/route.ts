import { type NextRequest, NextResponse } from "next/server"

// Tässä esimerkissä käytämme kovakoodattuja koodeja
// Tuotannossa nämä tulisivat tietokannasta
const VALID_CODES = ["SUMMARI2024", "KOSKELO123", "TESTCODE"]

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ success: false, message: "Koodi puuttuu" }, { status: 400 })
    }

    // Tarkista onko koodi validi
    const isValid = VALID_CODES.some((validCode) => validCode.toLowerCase() === code.toLowerCase())

    if (isValid) {
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
