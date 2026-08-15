import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required dispatch fields" },
        { status: 400 }
      );
    }

    // In production, this would dispatch to email webhook / logging service
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch {
    return NextResponse.json(
      { error: "Internal dispatch failure" },
      { status: 500 }
    );
  }
}
