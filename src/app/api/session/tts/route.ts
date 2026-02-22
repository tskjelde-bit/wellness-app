/**
 * POST /api/session/tts
 *
 * Streams binary audio (MP3) for a single sentence via ElevenLabs TTS.
 * Replaces the per-sentence binary audio chunks previously sent over WebSocket.
 *
 * Request body: { text: string, voiceId?: string, previousText?: string }
 * Response: binary audio/mpeg stream
 */

import { synthesizeSentence } from "@/lib/tts/tts-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { text, voiceId, previousText } = body;

    // Validate text is a non-empty string
    if (typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "text must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of synthesizeSentence(text, {
            voiceId: voiceId ?? undefined,
            previousText: previousText ?? undefined,
            signal: request.signal,
          })) {
            controller.enqueue(chunk);
          }
        } catch (error) {
          console.error("[api/session/tts] Synthesis error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[api/session/tts] Error:", error);
    return new Response(
      JSON.stringify({ error: "TTS synthesis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
