import { Client } from "@gradio/client";

export interface ChatterboxParams {
  exaggeration?: number;
  temperature?: number;
  cfgw?: number;
  seed?: number;
  vadTrim?: boolean;
}

const DEFAULT_PARAMS: ChatterboxParams = {
  exaggeration: 0.5,
  temperature: 0.8,
  cfgw: 0.5,
  seed: 0,
  vadTrim: false,
};

/**
 * Convert Gradio audio result to Blob
 */
async function audioResultToBlob(data: any): Promise<Blob> {
  const audio = Array.isArray(data) ? data[0] : data;

  if (audio instanceof Blob) return audio;

  if (typeof audio === "string") {
    const res = await fetch(audio);
    return res.blob();
  }

  // Gradio file descriptor with url property
  if (audio?.url) {
    const res = await fetch(audio.url);
    return res.blob();
  }

  // Gradio base64 data in .data field
  if (audio?.data) {
    const res = await fetch(audio.data);
    return res.blob();
  }

  throw new Error("Unexpected audio output format from Chatterbox");
}

/**
 * Generate speech using Chatterbox TTS (no voice cloning)
 */
export async function chatterboxTTS(text: string, params: ChatterboxParams = {}): Promise<Blob> {
  const p = { ...DEFAULT_PARAMS, ...params };
  const client = await Client.connect("ResembleAI/Chatterbox");

  const result = await client.predict("/generate_tts_audio", {
    text_input: text,
    audio_prompt_path_input: null,
    exaggeration_input: p.exaggeration,
    temperature_input: p.temperature,
    seed_num_input: p.seed,
    cfgw_input: p.cfgw,
    vad_trim_input: p.vadTrim,
  });

  return audioResultToBlob(result.data);
}

/**
 * Generate speech using Chatterbox with voice cloning.
 * Pass the reference audio file to clone the voice style.
 */
export async function chatterboxVoiceClone(
  text: string,
  audioFile: File | Blob,
  params: ChatterboxParams = {}
): Promise<Blob> {
  const p = { ...DEFAULT_PARAMS, ...params };
  const client = await Client.connect("ResembleAI/Chatterbox");

  const result = await client.predict("/generate_tts_audio", {
    text_input: text,
    audio_prompt_path_input: audioFile,
    exaggeration_input: p.exaggeration,
    temperature_input: p.temperature,
    seed_num_input: p.seed,
    cfgw_input: p.cfgw,
    vad_trim_input: p.vadTrim,
  });

  return audioResultToBlob(result.data);
}
