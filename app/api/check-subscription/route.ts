import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    // Hae asiakkaan tilaukset
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    const hasActiveSubscription = subscriptions.data.length > 0

    return NextResponse.json({
      hasActiveSubscription,
      subscription: subscriptions.data[0] || null,
    })
  } catch (error) {
    console.error("Subscription check error:", error)
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 })
  }
}
