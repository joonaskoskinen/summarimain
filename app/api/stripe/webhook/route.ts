import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Käsittele eri tapahtumat
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription
      if (subscription.status === "active") {
        // Aktivoi premium
        console.log(`Premium aktivoitu asiakkaalle: ${subscription.customer}`)
      }
      break

    case "customer.subscription.deleted":
    case "invoice.payment_failed":
      const deletedSub = event.data.object as Stripe.Subscription
      // Poista premium
      console.log(`Premium poistettu asiakkaalta: ${deletedSub.customer}`)
      break

    default:
      console.log(`Käsittelemätön tapahtuma: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
