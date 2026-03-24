import { NextResponse } from "next/server";

// RSVP API — full implementation in PR 7
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet", code: "NOT_IMPLEMENTED", requestId: crypto.randomUUID() },
    { status: 501 },
  );
}
