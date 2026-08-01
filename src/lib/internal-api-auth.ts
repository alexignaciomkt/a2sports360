import { headers } from "next/headers"
import { timingSafeEqual } from "crypto"

export async function requireInternalApiKey(): Promise<void> {
  const headersList = await headers()
  const apiKey = headersList.get("X-A2-API-KEY")
  
  if (!apiKey) {
    throw new Error("Missing API Key")
  }

  const expectedKey = process.env.A2_INTERNAL_API_KEY
  if (!expectedKey) {
    console.error("[Auth] A2_INTERNAL_API_KEY is not configured in the environment.")
    throw new Error("Internal Server Error")
  }

  // Safe timing comparison
  const expectedBuffer = Buffer.from(expectedKey)
  const actualBuffer = Buffer.from(apiKey)
  
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error("Invalid API Key")
  }
}
