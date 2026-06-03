import { NextRequest, NextResponse } from "next/server";
// À compléter selon la gestion de session (JWT/cookie)
export async function GET() {
  return NextResponse.json({ message: "Non implémenté" }, { status: 501 });
}
