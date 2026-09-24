import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Sparkles,
  Link as LinkIcon,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Mic,
  Layers,
} from 'lucide-react';
import { apiClient, TOKEN_KEY } from '../api/client';
import crystalHexImg from '../assets/images/crystal_prism_hex_1790244514122.jpg';
import crystalPyramidImg from '../assets/images/crystal_prism_pyramid_1790244533498.jpg';

export default function HomePage() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;
    apiClient
      .get('/api/auth/me')
      .then(() => {
        if (isMounted) {
          navigate('/chat', { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY);
          setCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050508] text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#060609] text-zinc-100 selection:bg-rose-500/30 selection:text-white relative overflow-x-hidden">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC AMBIENT GRADIENT MESH (matches screenshot aura) */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Top organic blurred orb - Coral / Rose / Amber glow */}
        <div
          className="absolute -top-32 -left-40 w-[600px] sm:w-[850px] h-[500px] sm:h-[700px] rounded-full opacity-60 mix-blend-screen filter blur-[120px]"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, rgba(244, 63, 94, 0.45), rgba(217, 70, 239, 0.35), rgba(249, 115, 22, 0.25), transparent 70%)',
          }}
        />

        {/* Top right organic blurred orb - Teal / Cyan / Indigo glow */}
        <div
          className="absolute -top-32 right-[-10%] w-[550px] sm:w-[750px] h-[480px] sm:h-[650px] rounded-full opacity-55 mix-blend-screen filter blur-[130px]"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, rgba(14, 165, 233, 0.45), rgba(99, 102, 241, 0.4), rgba(20, 184, 166, 0.2), transparent 70%)',
          }}
        />

        {/* Mid-page ambient glow (behind What's In It For You cards) */}
        <div
          className="absolute top-[800px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1300px] h-[600px] rounded-full opacity-35 filter blur-[150px]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.35), rgba(244, 63, 94, 0.25), rgba(56, 189, 248, 0.15), transparent 70%)',
          }}
        />

        {/* Bottom ambient glow */}
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[450px] rounded-full opacity-25 filter blur-[140px]"
          style={{
            background:
              'radial-gradient(circle, rgba(244, 63, 94, 0.3), rgba(99, 102, 241, 0.25), transparent 70%)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          MediaSense<span className="text-rose-400">.</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-300">
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('architecture')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Architecture
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('capabilities')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Capabilities
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-block text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 text-xs font-semibold bg-white text-zinc-950 rounded-full hover:bg-zinc-200 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply now
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 sm:pb-32 px-6 sm:px-10 text-center max-w-5xl mx-auto">
        {/* Micro-Kicker */}
        <div className="inline-block text-[11px] font-semibold tracking-[0.25em] text-zinc-300 uppercase mb-6 sm:mb-8 opacity-90">
          MULTIMODAL RAG ARCHITECTURE
        </div>

        {/* Giant Hero Title (matches Profico Academy hero style) */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-white leading-[0.95] mb-8 select-none">
          MediaSense
          <br />
          <span className="text-zinc-100">Academy</span>
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed mb-10">
          Upload documents and images, then ask questions in text or voice. Every answer is strictly grounded in your own content, with verified sources you can inspect.
        </p>

        {/* Center Pill Action Button */}
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-7 py-3 text-xs sm:text-sm font-medium text-zinc-100 bg-zinc-900/90 border border-zinc-700/80 rounded-full hover:bg-zinc-800 hover:border-zinc-500 transition-all shadow-lg hover:scale-105"
          >
            Apply now
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In &rarr;
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. METRIC STRIP (matches LOCATION | DURATION | MENTORS | COURSES) */}
      {/* ========================================================================= */}
      <section className="relative z-10 border-y border-zinc-800/80 bg-[#07070b]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
          <div className="px-6 py-5">
            <span className="text-[10px] tracking-wider uppercase text-zinc-300 block mb-1">
              FORMAT SUPPORT
            </span>
            <div className="text-sm font-medium text-white">Docs & Images</div>
          </div>

          <div className="px-6 py-5">
            <span className="text-[10px] tracking-wider uppercase text-zinc-300 block mb-1">
              QUERY MODES
            </span>
            <div className="text-sm font-medium text-white">Voice & Text</div>
          </div>

          <div className="px-6 py-5">
            <span className="text-[10px] tracking-wider uppercase text-zinc-300 block mb-1">
              GROUNDING
            </span>
            <div className="text-sm font-medium text-white">Exact Citations</div>
          </div>

          <div className="px-6 py-5">
            <span className="text-[10px] tracking-wider uppercase text-zinc-300 block mb-1">
              VECTOR PIPELINE
            </span>
            <div className="text-sm font-medium text-white">FastAPI Core</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. "WHAT'S IN IT FOR YOU?" 4-CARD SHOWCASE SECTION */}
      {/* ========================================================================= */}
      <section id="about" className="relative z-10 py-24 sm:py-32 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          {/* Centered Sparkle Motif */}
          <div className="flex justify-center mb-6">
            <Sparkles className="w-5 h-5 text-white/90 animate-pulse" />
          </div>

          {/* Micro Pill Button */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-md text-[11px] text-zinc-300 mb-6">
            <LinkIcon className="w-3 h-3 text-zinc-400" />
            <span>Learn more about us</span>
          </div>

          {/* Section Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
            What's in it for you?
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md mx-auto">
            Gain all the intelligence you need to accelerate your media comprehension through grounded RAG technology.
          </p>
        </div>

        {/* 4 Cards Grid with Refractive Prisms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 01 */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 p-6 flex flex-col justify-between min-h-[380px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Hands-on learning</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Each upload takes your PDFs, documents, or images through real-time chunking, OCR parsing, and indexing.
              </p>
            </div>

            <div className="relative mt-8 flex items-end justify-between">
              {/* Prismatic Asset */}
              <div className="w-24 h-24 relative overflow-hidden rounded-lg opacity-85 group-hover:opacity-100 transition-opacity">
                <img
                  src={crystalHexImg}
                  alt="Geometric Glass Crystal"
                  className="w-full h-full object-cover rounded-lg filter drop-shadow-lg"
                  loading="lazy"
                />
              </div>
              <span className="text-2xl font-light tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                01
              </span>
            </div>
          </div>

          {/* CARD 02 */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 p-6 flex flex-col justify-between min-h-[380px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Defensive grounding</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Take advantage of strict retrieval constraints that prevent hallucination and quote only verified source chunks.
              </p>
            </div>

            <div className="relative mt-8 flex items-end justify-between">
              {/* Glass refraction SVG visual */}
              <div className="w-20 h-20 relative flex items-center justify-center">
                <div className="w-16 h-16 border border-zinc-700/60 rounded-xl rotate-12 bg-white/[0.03] backdrop-blur-sm shadow-inner flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-zinc-400 -rotate-12" />
                </div>
              </div>
              <span className="text-2xl font-light tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                02
              </span>
            </div>
          </div>

          {/* CARD 03 */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 p-6 flex flex-col justify-between min-h-[380px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Widely applicable skills</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Query with typing or natural voice recording. The agent transcribes your audio and synthesizes spoken replies.
              </p>
            </div>

            <div className="relative mt-8 flex items-end justify-between">
              {/* Hex Prism Asset */}
              <div className="w-24 h-24 relative overflow-hidden rounded-lg opacity-85 group-hover:opacity-100 transition-opacity">
                <img
                  src={crystalHexImg}
                  alt="Hexagonal Glass Prism"
                  className="w-full h-full object-cover rounded-lg rotate-45 scale-90 filter drop-shadow-lg"
                  loading="lazy"
                />
              </div>
              <span className="text-2xl font-light tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                03
              </span>
            </div>
          </div>

          {/* CARD 04 */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 p-6 flex flex-col justify-between min-h-[380px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Street cred & audit</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Upon query completion you will receive inspectable citations, filenames, and page markers for every assertion.
              </p>
            </div>

            <div className="relative mt-8 flex items-end justify-between">
              {/* Pyramid Prism Asset */}
              <div className="w-24 h-24 relative overflow-hidden rounded-lg opacity-85 group-hover:opacity-100 transition-opacity">
                <img
                  src={crystalPyramidImg}
                  alt="Tetrahedron Glass Prism"
                  className="w-full h-full object-cover rounded-lg filter drop-shadow-lg"
                  loading="lazy"
                />
              </div>
              <span className="text-2xl font-light tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                04
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ARCHITECTURE PIPELINE SECTION */}
      {/* ========================================================================= */}
      <section id="architecture" className="relative z-10 py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase block mb-2">
              PROCESSING LIFECYCLE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              The Grounding Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            How documents and images are vectorized, indexed, and retrieved with strict source attribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-rose-400 mb-5">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">1. Ingest & Chunk</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload PDF documents or images up to 4MB. The FastAPI engine segments files into semantically coherent chunk fragments with extracted captions and metadata.
            </p>
          </div>

          <div className="p-7 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-indigo-400 mb-5">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">2. Similarity Retrieval</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When queries arrive via text or voice, dense vector embeddings compare semantic distance to extract only the most relevant passages.
            </p>
          </div>

          <div className="p-7 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-teal-400 mb-5">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">3. Voice & Provenance</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The agent synthesizes concise responses accompanied by explicit citations. Audio streams are played back directly in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CAPABILITIES & MODALITIES */}
      {/* ========================================================================= */}
      <section id="capabilities" className="relative z-10 py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase block mb-2">
            INTELLIGENCE SUITE
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Unified Multimodal Features
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A single agent for your documents, vision media, and voice recordings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900/70 to-zinc-950/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="text-xs font-mono text-rose-400 uppercase tracking-wider mb-2">Vision & Document Processing</div>
            <h3 className="text-xl font-bold text-white mb-3">Automatic Captioning & Page Extraction</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              When you upload images, visual recognition generates dense descriptive tags and captions. Documents have their page count, chapters, and sections automatically indexed.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
              <span className="px-3 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60">JPEG · PNG · GIF · BMP</span>
              <span className="px-3 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60">PDF · DOC · DOCX</span>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900/70 to-zinc-950/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">Audio & Voice Querying</div>
            <h3 className="text-xl font-bold text-white mb-3">Interactive Spoken Intelligence</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Speak questions naturally using the browser's MediaRecorder interface or upload voice memos. The engine transcribes audio, queries the index, and synthesizes audio replies.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
              <span className="px-3 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60">Browser MediaRecorder</span>
              <span className="px-3 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60">Audio Playback Synthesizer</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section id="faq" className="relative z-10 py-24 px-6 sm:px-10 max-w-4xl mx-auto border-t border-zinc-800/60">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase block mb-2">
            QUESTIONS & DETAILS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does MediaSense prevent hallucinations?',
              a: 'MediaSense enforces strict grounding. When a query is made, vector search locates exact chunks from your uploaded documents and images. The agent synthesizes an answer strictly based on these source snippets and cites the file names and page numbers.',
            },
            {
              q: 'What file types can I upload to the knowledge base?',
              a: 'You can upload images (JPEG, PNG, GIF, BMP up to 4MB) via the Vision endpoint, and documents (PDF, DOC, DOCX) via the Documents endpoint. Everything is automatically indexed.',
            },
            {
              q: 'How does the voice interaction work?',
              a: 'The voice tool records your voice directly in the browser using the MediaRecorder API, or lets you upload audio files. It posts the recording to /api/voice/ask, where audio is transcribed, answered, and returned with audio playback.',
            },
            {
              q: 'Where does the backend run?',
              a: 'The backend runs on FastAPI at http://127.0.0.1:8000. All authenticated API calls attach your JWT Bearer token and refresh seamlessly.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between text-sm font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                    openFaq === idx ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. BOTTOM CTA SECTION */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 px-6 sm:px-10 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 via-zinc-900/40 to-zinc-950 p-10 sm:p-16 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle inner gradient */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.4), rgba(99, 102, 241, 0.3), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Ready to explore your media?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
              Create an account now to start indexing documents, uploading vision assets, and querying your knowledge base.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3 text-xs font-semibold bg-white text-zinc-950 rounded-full hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-800 rounded-full hover:bg-zinc-900 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FOOTER */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-zinc-800/80 bg-[#050508] py-12 px-6 sm:px-10 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">MediaSense.</span>
            <span className="text-zinc-400">|</span>
            <span>Smart Media Analysis Agent</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <Link to="/login" className="hover:text-zinc-200 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-zinc-200 transition-colors">
              Create Account
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </div>

          <div>&copy; {new Date().getFullYear()} MediaSense. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
