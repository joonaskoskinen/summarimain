const STORAGE_KEY = "summari_usage"
// Kovakoodattu premium-koodi (tuotannossa tämä tulisi API:sta)
const PREMIUM_CODE = "koskelo123"

export interface UsageData {
  count: number
  lastReset: string
  isPremium: boolean
  customerId?: string
  activatedAt?: string
  subscriptionId?: string
  expiresAt?: string // Lisätään vanhenemispäivä
}

export function getUsageData(): UsageData {
  if (typeof window === "undefined") {
    return { count: 0, lastReset: new Date().toDateString(), isPremium: false }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const newData = { count: 0, lastReset: new Date().toDateString(), isPremium: false }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    return newData
  }

  try {
    const data = JSON.parse(stored)

    // Tarkista onko premium vanhentunut
    if (data.isPremium && data.expiresAt) {
      const expiryDate = new Date(data.expiresAt)
      if (new Date() > expiryDate) {
        console.log("Premium vanhentunut, poistetaan...")
        data.isPremium = false
        data.customerId = undefined
        data.subscriptionId = undefined
        data.expiresAt = undefined
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    }

    // Reset count daily (mutta EI premium-statusta!)
    const today = new Date().toDateString()
    if (data.lastReset !== today) {
      data.count = 0
      data.lastReset = today
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    return data
  } catch (error) {
    console.warn("Korruptoitunut localStorage data, luodaan uusi")
    const newData = { count: 0, lastReset: new Date().toDateString(), isPremium: false }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    return newData
  }
}

export function incrementUsage(): UsageData {
  const data = getUsageData()
  data.count += 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

// Muokataan activatePremium-funktiota tukemaan koodeja
export function activatePremium(code: string): boolean {
  // Tarkista koodi API:n kautta
  return false // Tämä korvataan alla olevalla toteutuksella
}

// Lisätään uusi funktio koodin lunastamiseen
export async function redeemCode(code: string): Promise<{ success: boolean; message: string; expiryDays?: number }> {
  try {
    const response = await fetch("/api/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })

    const data = await response.json()

    if (data.success) {
      // Aktivoi premium
      const data = getUsageData()
      data.isPremium = true
      data.activatedAt = new Date().toISOString()

      // Aseta vanhenemispäivä (oletuksena 30 päivää tai API:n palauttama arvo)
      const expiryDays = data.expiryDays || 30
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)
      data.expiresAt = expiryDate.toISOString()

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    return data
  } catch (error) {
    console.error("Code redemption error:", error)
    return { success: false, message: "Koodin lunastuksessa tapahtui virhe" }
  }
}

export function activatePremiumWithCustomer(customerId: string, subscriptionId?: string): void {
  const data = getUsageData()
  data.isPremium = true
  data.customerId = customerId
  data.subscriptionId = subscriptionId
  data.activatedAt = new Date().toISOString()
  // Stripe-tilaukset ovat kuukausittaisia, aseta vanhenemispäivä 35 päivän päähän (vähän pelivaraa)
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 35)
  data.expiresAt = expiryDate.toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function revokePremium(): void {
  const data = getUsageData()
  data.isPremium = false
  data.customerId = undefined
  data.subscriptionId = undefined
  data.expiresAt = undefined
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  console.log("Premium poistettu")
}

export function canUseService(): { allowed: boolean; remaining: number } {
  const data = getUsageData()
  if (data.isPremium) {
    return { allowed: true, remaining: -1 } // Unlimited
  }

  const remaining = Math.max(0, 3 - data.count)
  return { allowed: remaining > 0, remaining }
}

export function resetUsageForTesting(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
    console.log("Usage data resetoitu testausta varten")
  }
}

export function isPremiumActive(): boolean {
  const data = getUsageData()
  return data.isPremium === true
}

// Uusi funktio premium-statuksen tarkistamiseen
export function checkPremiumStatus(): { isPremium: boolean; expiresAt?: string; daysLeft?: number } {
  const data = getUsageData()

  if (!data.isPremium) {
    return { isPremium: false }
  }

  if (data.expiresAt) {
    const expiryDate = new Date(data.expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      isPremium: data.isPremium,
      expiresAt: data.expiresAt,
      daysLeft: Math.max(0, daysLeft),
    }
  }

  return { isPremium: data.isPremium }
}
