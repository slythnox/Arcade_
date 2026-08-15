import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ recorded: true, count: 1 });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }
}
