import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    return NextResponse.json({ recorded: true, count: 1 });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }
}
