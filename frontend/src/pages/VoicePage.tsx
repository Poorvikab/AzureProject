import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';

interface VoiceResponseState {
  question?: string;
  answer?: string;
  audioSrc?: string;
}

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceResponseState | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser environment. Please upload an audio file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const ext = recorder.mimeType.includes('mp4') ? 'mp4' : recorder.mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([audioBlob], `recording-${Date.now()}.${ext}`, {
          type: audioBlob.type,
        });
        uploadAudioFile(file);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      setError('Microphone access was denied or is unavailable. Please check permissions or upload an audio file.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const uploadAudioFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/api/voice/ask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      // Extract question defensively
      const question =
        data.transcribed_question ||
        data.transcription ||
        data.question ||
        data.transcript ||
        data.prompt ||
        '';

      // Extract answer defensively
      const answer =
        data.answer ||
        data.text ||
        data.response ||
        data.output ||
        data.message ||
        (typeof data === 'string' ? data : '');

      // Extract audio URL or base64 defensively
            // Backend always returns raw base64 under `audio_base64` — no need to guess
      let audioSrc: string | undefined = undefined;
      if (typeof data.audio_base64 === 'string' && data.audio_base64.trim()) {
        audioSrc = `data:audio/mp3;base64,${data.audio_base64.trim()}`;
      }

      setResult({
        question: question || undefined,
        answer: answer || 'No text answer returned.',
        audioSrc,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadAudioFile(file);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Voice Query</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Record your question using your microphone or upload an audio file to query your media.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-md bg-zinc-900 border border-red-900/60 text-red-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Recording Control Panel */}
      <div className="border border-zinc-800 rounded-lg p-8 bg-zinc-900/40 text-center mb-6">
        <div className="flex flex-col items-center justify-center">
          {isRecording ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-950 border border-red-700/80 flex items-center justify-center mx-auto text-red-400 animate-pulse">
                <Mic className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm font-medium text-red-400">Recording Audio...</div>
                <div className="text-xs font-mono tabular-nums text-zinc-400 mt-1">
                  {formatSeconds(recordingDuration)}
                </div>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop & Query</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={startRecording}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center mx-auto text-zinc-200 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Start recording audio"
              >
                <Mic className="w-7 h-7" />
              </button>
              <div>
                <div className="text-sm font-medium text-zinc-200">
                  {isProcessing ? 'Processing Audio...' : 'Click to start recording'}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Speak clearly into your microphone
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Picker Fallback */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isProcessing}
            className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Or upload an audio recording file</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isProcessing && (
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30 text-center space-y-2">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
          <div className="text-xs text-zinc-300 font-medium">Transcribing audio and querying knowledge base...</div>
        </div>
      )}

      {/* Result Display */}
      {result && !isProcessing && (
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/40 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">
            Voice Query Response
          </h2>

          {/* Transcribed Question */}
          {result.question && (
            <div>
              <div className="text-xs font-medium text-zinc-400 mb-1">Transcribed Question</div>
              <p className="text-sm text-zinc-200 bg-zinc-950 p-3 rounded border border-zinc-800/80">
                "{result.question}"
              </p>
            </div>
          )}

          {/* Text Answer */}
          <div>
            <div className="text-xs font-medium text-zinc-400 mb-1">Answer</div>
            <p className="text-sm text-zinc-100 bg-zinc-950 p-3.5 rounded border border-zinc-800/80 leading-relaxed whitespace-pre-wrap">
              {result.answer}
            </p>
          </div>

          {/* Audio Playback if present */}
          {result.audioSrc && (
            <div className="pt-2">
              <div className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Audio Response</span>
              </div>
              <audio
                ref={audioPlayerRef}
                controls
                autoPlay
                src={result.audioSrc}
                className="w-full h-10 rounded bg-zinc-900"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
