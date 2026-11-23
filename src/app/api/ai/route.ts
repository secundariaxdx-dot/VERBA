import { MODEL, aiEnabled } from "@/lib/server/claude";

/** Lets the client know whether AI features are configured on this server. */
export async function GET() {
  return Response.json({ enabled: aiEnabled(), model: aiEnabled() ? MODEL : null });
}
