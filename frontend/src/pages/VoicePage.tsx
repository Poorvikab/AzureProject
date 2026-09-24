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
      const question =
        data.transcribed_question ||
        data.transcription ||
        data.question ||
        data.transcript ||
        data.prompt ||
        '';

      const answer =
        data.answer ||
        data.text ||
        data.response ||
        data.output ||
        data.message ||
        (typeof data === 'string' ? data : '');

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
    <div className="page-shell">
      <div className="page-shell-inner max-w-3xl py-8 sm:py-12">
        <div className="mb-6">
          <div className="kicker mb-3">Voice interface</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Voice query</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Record a question using your microphone or upload an audio file to query your media.
          </p>
        </div>

        {error && (
          <div role="alert" className="status-banner error mb-6">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center text-center">
            {isRecording ? (
              <div className="space-y-5">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/60 bg-rose-600/10 text-rose-200 shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse">
                  <Mic className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-200">Recording audio</div>
                  <div className="mt-2 font-mono text-sm text-slate-200">{formatSeconds(recordingDuration)}</div>
                </div>
                <button type="button" onClick={stopRecording} className="primary-button max-w-[220px] bg-gradient-to-r from-rose-500 to-orange-500 shadow-[0_20px_35px_rgba(244,63,94,0.28)]">
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop & Query</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.7)] transition-all duration-200 hover:border-cyan-300/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Start recording audio"
                >
                  <Mic className="h-8 w-8" />
                </button>
                <div>
                  <div className="text-base font-medium text-white">
                    {isProcessing ? 'Processing audio...' : 'Click to start recording'}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">Speak clearly into your microphone</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
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
              className="secondary-button mx-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>Or upload an audio recording file</span>
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="status-banner mt-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Transcribing audio and querying knowledge base...</span>
          </div>
        )}

        {result && (
          <div className="glass-panel mt-6 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
              <Volume2 className="h-4 w-4" />
              <span>Voice response</span>
            </div>

            {result.question && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Question</div>
                <p className="mt-2 text-sm text-slate-100">{result.question}</p>
              </div>
            )}

            {result.answer && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Answer</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{result.answer}</p>
              </div>
            )}

            {result.audioSrc && (
              <div className="mt-4">
                <audio controls src={result.audioSrc} className="w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

