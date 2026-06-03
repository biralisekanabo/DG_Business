import { NextRequest, NextResponse } from "next/server";
// À compléter selon la gestion de session (JWT/cookie)
export async function POST() {
  return NextResponse.json({ message: "Déconnexion fictive" });
}
