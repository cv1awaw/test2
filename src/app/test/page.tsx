"use client";

import { useState, useEffect } from "react";
import {
    Send, Globe, Youtube, MessageSquare, Network, Sparkles,
    CheckCircle, AlertCircle, Loader2, PlayCircle, Mic, RefreshCw
} from "lucide-react";
import mermaid from "mermaid";

// Add Type for Transcript Item
type TranscriptItem = {
    text: string;
    start: number;
    duration: number;
};

type LanguageOption = {
    code: string;
    name: string;
    is_generated: boolean;
};

export default function TestPage() {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'translate' | 'youtube' | 'mindmap'>('translate');

    // Translator
    const [transText, setTransText] = useState("");
    const [transTarget, setTransTarget] = useState("es");
    const [transResult, setTransResult] = useState("");
    const [transLoading, setTransLoading] = useState(false);

    // YouTube
    const [ytUrl, setYtUrl] = useState("");
    const [ytResult, setYtResult] = useState<TranscriptItem[] | string>(""); // Can be array or string error
    const [ytLoading, setYtLoading] = useState(false);
    const [ytLanguage, setYtLanguage] = useState("en");
    const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([]);
    const [currentLangName, setCurrentLangName] = useState("");

    // Mind Map
    const [mmInput, setMmInput] = useState("");
    const [mmResult, setMmResult] = useState("");
    const [mmLoading, setMmLoading] = useState(false);

    // --- Effects ---
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'sans-serif'
        });
    }, []);

    useEffect(() => {
        // Robust check for mermaid content
        const isMermaid = /^(mindmap|graph|flowchart|sequenceDiagram)/m.test(mmResult);

        if (mmResult && isMermaid) {
            const renderMap = async () => {
                try {
                    const element = document.getElementById("mermaid-output");
                    if (element) {
                        element.removeAttribute('data-processed');
                        element.innerHTML = mmResult;
                        await mermaid.run({ nodes: [element] });
                    }
                } catch (e) {
                    console.error("Mermaid Render Error", e);
                    // Optional: Display error in UI
                    const element = document.getElementById("mermaid-output");
                    if (element) element.innerText = "Failed to render graph. Syntax error in response.";
                }
            }
            renderMap();
        }
    }, [mmResult, activeTab]);

    // --- Helpers ---
    const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(14, 5); // MM:SS
    };

    // --- Handlers ---
    const handleTranslate = async () => {
        if (!transText.trim()) return;
        setTransLoading(true);
        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: transText, target: transTarget })
            });
            const data = await res.json();
            setTransResult(data.translatedText || data.error);
        } catch (e: any) {
            setTransResult("Error: " + e.message);
        }
        setTransLoading(false);
    };

    const handleYoutube = async (langOverride?: string) => {
        if (!ytUrl.trim()) return;
        setYtLoading(true);
        // Don't clear result immediately if changing lang, just show loading
        if (!langOverride) setYtResult("");

        try {
            const langToSend = langOverride || ytLanguage;

            const res = await fetch("/api/transcript", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: ytUrl, lang: langToSend })
            });
            const data = await res.json();

            if (data.success) {
                setYtResult(data.transcript);
                if (data.available_languages) {
                    setAvailableLanguages(data.available_languages);
                }
                setCurrentLangName(data.language_name);
                // If we requested a specific language, update state to match response if needed
                // But usually we just trust the selector
            } else {
                setYtResult(data.error || "Unknown error");
            }
        } catch (e: any) {
            setYtResult("Error: " + e.message);
        }
        setYtLoading(false);
    };

    const onLanguageChange = (newLang: string) => {
        setYtLanguage(newLang);
        handleYoutube(newLang);
    };

    const handleMindMap = async () => {
        if (!mmInput.trim()) return;
        setMmLoading(true);
        setMmResult("");
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "gpt-5",
                    messages: [
                        { role: "system", content: "You are a Mind Map Generator. Output ONLY valid Mermaid.js syntax. Start immediately with `mindmap` or `graph TD`. Do not use code blocks or markdown formatting." },
                        { role: "user", content: `Create a comprehensive mind map about: ${mmInput}` }
                    ],
                    stream: false
                })
            });
            const data = await res.json();
            let content = data.choices?.[0]?.message?.content || "";

            // Cleaning pipeline
            content = content.replace(/```mermaid/g, "").replace(/```/g, "").trim();

            // Find start of valid mermaid syntax
            const mindmapStart = content.search(/^(mindmap|graph|flowchart|sequenceDiagram)/m);
            if (mindmapStart !== -1) {
                content = content.substring(mindmapStart);
            }

            setMmResult(content);
        } catch (e: any) {
            setMmResult("Error: " + e.message);
        }
        setMmLoading(false);
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 sm:p-12 relative overflow-hidden pt-24">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px] -z-10 animate-pulse delay-700" />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                        <Sparkles size={12} />
                        <span>Experimental Features</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                        AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Laboratory</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Test and interact with our latest neural modules.
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex flex-wrap justify-center gap-1">
                        <TabButton
                            active={activeTab === 'translate'}
                            onClick={() => setActiveTab('translate')}
                            icon={<Globe size={18} />}
                            label="Neural Translate"
                        />
                        <TabButton
                            active={activeTab === 'youtube'}
                            onClick={() => setActiveTab('youtube')}
                            icon={<Youtube size={18} />}
                            label="Video Intelligence"
                        />
                        <TabButton
                            active={activeTab === 'mindmap'}
                            onClick={() => setActiveTab('mindmap')}
                            icon={<Network size={18} />}
                            label="Structure Viz"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">

                    {/* TRANSLATOR */}
                    {activeTab === 'translate' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Input Text</label>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-gray-200 focus:outline-none focus:border-blue-500/50 min-h-[140px] resize-none transition-all"
                                        placeholder="Enter text to translate..."
                                        value={transText}
                                        onChange={e => setTransText(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <select
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:outline-none hover:bg-white/5 transition-colors cursor-pointer"
                                        value={transTarget}
                                        onChange={e => setTransTarget(e.target.value)}
                                    >
                                        <option value="es">Spanish (Español)</option>
                                        <option value="fr">French (Français)</option>
                                        <option value="de">German (Deutsch)</option>
                                        <option value="ja">Japanese (日本語)</option>
                                        <option value="zh">Chinese (中文)</option>
                                        <option value="ru">Russian (Русский)</option>
                                    </select>

                                    <button
                                        onClick={handleTranslate}
                                        disabled={transLoading || !transText.trim()}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                                    >
                                        {transLoading ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
                                        {transLoading ? "Translating..." : "Translate Now"}
                                    </button>
                                </div>

                                {transResult && (
                                    <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                        <span className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2 block">Translation Output</span>
                                        <p className="text-lg text-white leading-relaxed">{transResult}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* YOUTUBE */}
                    {activeTab === 'youtube' && (
                        <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-300">

                            {/* Input Section (Centered initially or at top) */}
                            <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 flex gap-4 max-w-3xl mx-auto">
                                <div className="relative group flex-1">
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-gray-200 focus:outline-none focus:border-red-500/50 transition-all text-sm"
                                        placeholder="Paste YouTube URL here..."
                                        value={ytUrl}
                                        onChange={e => setYtUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleYoutube()}
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors">
                                        <Youtube size={18} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleYoutube()}
                                    disabled={ytLoading || !ytUrl.trim()}
                                    className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-6 font-medium transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {ytLoading ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                                    <span>Load Video</span>
                                </button>
                            </div>

                            {/* Main Content Grid */}
                            {(ytResult || availableLanguages.length > 0 || ytLoading) && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-200px)] min-h-[600px]">

                                    {/* Left Col: Video Player & Context (7 cols) */}
                                    <div className="lg:col-span-7 flex flex-col gap-6 h-full">

                                        {/* Video Player Frame */}
                                        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 bg-black/40 aspect-video relative flex-shrink-0 shadow-2xl shadow-black/50">
                                            {(() => {
                                                const videoIdMatch = ytUrl.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
                                                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                                                return videoId ? (
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                        <Youtube size={48} className="opacity-20" />
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* AI Chat Placeholder (Bottom Left) */}
                                        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex-1 relative overflow-hidden bg-gradient-to-br from-blue-900/10 to-transparent">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                                            <div className="flex flex-col h-full justify-between">
                                                <div>
                                                    <h3 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
                                                        <Sparkles size={16} className="text-blue-400" />
                                                        Video Intelligence AI
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        Ask questions about this video. The AI has read the full transcript context.
                                                    </p>
                                                </div>

                                                <div className="mt-4">
                                                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-all flex items-center justify-center gap-2 group">
                                                        <MessageSquare size={16} className="group-hover:text-blue-400 transition-colors" />
                                                        Start AI Chat (Coming Soon)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col: Transcript Stream (5 cols) */}
                                    <div className="lg:col-span-5 h-full flex flex-col glass-panel rounded-3xl border border-white/10 bg-black/20 overflow-hidden relative">

                                        {/* Stream Header */}
                                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-red-500/20 p-1.5 rounded-lg">
                                                    <CheckCircle size={14} className="text-red-400" />
                                                </div>
                                                <span className="font-semibold text-sm text-gray-200">Transcript Stream</span>
                                            </div>

                                            {/* Language Dropdown (Mini) */}
                                            {availableLanguages.length > 0 && (
                                                <select
                                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none hover:bg-white/5 transition-colors cursor-pointer max-w-[120px]"
                                                    value={ytLanguage}
                                                    onChange={(e) => onLanguageChange(e.target.value)}
                                                >
                                                    {availableLanguages.map((lang) => (
                                                        <option key={lang.code} value={lang.code}>
                                                            {lang.name} {lang.is_generated ? '(Auto)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* Scrollable List */}
                                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-4 space-y-4 relative">
                                            {ytLoading && !ytResult && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin text-red-500" size={32} />
                                                    <span className="text-xs text-gray-500 animate-pulse">Extracting audio...</span>
                                                </div>
                                            )}

                                            {!ytLoading && Array.isArray(ytResult) && ytResult.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 group">
                                                    {/* Timestamp Bubble */}
                                                    <div className="flex-shrink-0 pt-1">
                                                        <div className="bg-white/5 border border-white/5 rounded-md px-2 py-1 text-[10px] font-mono text-blue-300 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all select-none cursor-pointer">
                                                            {formatTime(item.start)}
                                                        </div>
                                                    </div>

                                                    {/* Text Bubble */}
                                                    <div className="flex-1 py-1 px-3 rounded-xl hover:bg-white/5 transition-colors -ml-2 border border-transparent hover:border-white/5">
                                                        <p className="text-gray-300 text-sm leading-relaxed text-pretty">
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Error State */}
                                            {!ytLoading && typeof ytResult === 'string' && ytResult && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                                                    {ytResult}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-3 border-t border-white/5 bg-black/20 flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    if (Array.isArray(ytResult)) {
                                                        const text = ytResult.map(i => i.text).join(" ");
                                                        navigator.clipboard.writeText(text);
                                                    }
                                                }}
                                                className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors px-3 py-1.5 hover:bg-white/5 rounded-lg"
                                            >
                                                <CheckCircle size={14} />
                                                Copy Full Text
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Initial Empty State Description */}
                            {!ytResult && !ytLoading && availableLanguages.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <Youtube className="mx-auto mb-4 text-gray-600" size={64} />
                                    <h3 className="text-xl font-semibold text-gray-700">Ready to Watch</h3>
                                    <p className="text-gray-600">Paste a YouTube link above to analyze.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MIND MAP */}
                    {activeTab === 'mindmap' && (
                        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all"
                                        placeholder="What would you like to visualize?"
                                        value={mmInput}
                                        onChange={e => setMmInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleMindMap()}
                                    />
                                    <button
                                        onClick={handleMindMap}
                                        disabled={mmLoading || !mmInput.trim()}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-2xl font-medium transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {mmLoading ? <Loader2 className="animate-spin" size={20} /> : <Network size={20} />}
                                        {mmLoading ? "Thinking..." : "Generate"}
                                    </button>
                                </div>

                                <div className="bg-black/30 rounded-3xl border border-white/5 min-h-[500px] flex items-center justify-center overflow-hidden relative group">
                                    {!mmResult && !mmLoading && (
                                        <div className="text-center text-gray-600">
                                            <Network className="mx-auto mb-4 opacity-20" size={64} />
                                            <p>Enter a topic above to generate a mind map</p>
                                        </div>
                                    )}

                                    {mmLoading && (
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="text-purple-500 animate-spin" size={48} />
                                            <p className="text-gray-400 animate-pulse">Analyzing structure...</p>
                                        </div>
                                    )}

                                    <div
                                        id="mermaid-output"
                                        className="w-full h-full p-8 flex items-center justify-center overflow-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2
                ${active
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5 border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    )
}
