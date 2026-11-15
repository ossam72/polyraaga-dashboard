import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://phillis-fussbudgety-jaclyn.ngrok-free.dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = `${BACKEND_BASE}/media/${path.join("/")}`;

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!upstreamResponse.ok) {
    return new NextResponse(null, { status: upstreamResponse.status });
  }

  const contentType =
    upstreamResponse.headers.get("Content-Type") || "application/octet-stream";

  const buffer = await upstreamResponse.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}