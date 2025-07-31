import React, { useState, useCallback, useEffect } from 'react';
import { detectAIContent, humanizeText } from './services/geminiService';
import type { AnalysisResult } from './types';
import Header from './components/Header';
import Loader from './components/Loader';
import Icon from './components/Icon';

const AnalysisCard: React.FC<{ title: string; rating: string; analysis: string; color:string }> = ({ title, rating, analysis, color }) => {
    return (
        <div className="border-2 border-black rounded-lg p-4 bg-white">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className={`font-bold text-xl ${color}`}>{rating}</p>
            <p className="text-gray-700 mt-2">{analysis}</p>
        </div>
    );
}

const ApiInfoPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white border-2 border-black rounded-lg shadow-lg p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">How to Get Your Gemini API Key</h2>
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                    <h3 className="font-semibold text-black">Create an AI Studio account</h3>
                    <p>If you don't have one, you'll need to create an account with Google AI Studio. It's free and gives you access to the Gemini family of models.</p>
                    <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Go to Google AI Studio →</a>
                </li>
                <li>
                    <h3 className="font-semibold text-black">Generate your API Key</h3>
                    <p>Once logged in, navigate to the API key section and generate a new key. This key is your personal credential to use the service.</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Get Your API Key Here →</a>
                </li>
                <li>
                    <h3 className="font-semibold text-black">Paste the Key</h3>
                    <p>Copy the generated key and paste it into the "Gemini API Key" field in this app to unlock all features.</p>
                </li>
            </ol>
            <button onClick={onClose} className="mt-6 w-full px-4 py-2 font-bold text-white bg-gray-800 border-2 border-black rounded-md hover:bg-gray-700">
                Close
            </button>
        </div>
    </div>
);


const getScoreColor = (score: number) => {
    if (score > 65) return 'text-red-500';
    if (score > 40) return 'text-yellow-500';
    return 'text-green-500';
};

const ResultsDisplay: React.FC<{ analysisResult: AnalysisResult | null }> = ({ analysisResult }) => {
    if (!analysisResult) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="border-2 border-black rounded-lg p-6 bg-white text-center">
                <h2 className="text-xl font-bold text-gray-800">Likelihood of AI Content</h2>
                <p className={`text-7xl font-bold my-2 ${getScoreColor(analysisResult.aiScore)}`}>
                    {analysisResult.aiScore}%
                </p>
                <p className="text-gray-700 font-medium">{analysisResult.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnalysisCard title="Perplexity" {...analysisResult.perplexity} color="text-blue-500" />
                <AnalysisCard title="Burstiness" {...analysisResult.burstiness} color="text-pink-500" />
            </div>
             <AnalysisCard title="Uniformity" {...analysisResult.uniformity} color="text-indigo-500" />
        </div>
    );
};

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [showApiInfo, setShowApiInfo] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [humanizedText, setHumanizedText] = useState<string | null>(null);
    const [humanizedAiScore, setHumanizedAiScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('Ready to analyze or humanize your text.');
    const [activeTab, setActiveTab] = useState<'detector' | 'humanizer' | 'welcome'>('welcome');
    const [isCopied, setIsCopied] = useState<boolean>(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('geminiApiKey');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleApiKeyChange = (key: string) => {
        setApiKey(key);
        localStorage.setItem('geminiApiKey', key);
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInputText(text);
                setError('');
                setActiveTab('welcome');
                setAnalysisResult(null);
                setHumanizedText(null);
                setHumanizedAiScore(null);
            };
            reader.readAsText(file);
        }
    };

    const handleDetect = useCallback(async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to analyze.');
            return;
        }
        if (!apiKey) {
            setError('Please enter your Gemini API key above.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setHumanizedText(null);
        setHumanizedAiScore(null);
        setStatusMessage('Detecting AI patterns...');
        setActiveTab('detector');

        try {
            const result = await detectAIContent(apiKey, inputText);
            setAnalysisResult(result);
            setStatusMessage('Analysis complete.');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setStatusMessage('An error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [inputText, apiKey]);

    const handleHumanize = useCallback(async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to humanize.');
            return;
        }
         if (!apiKey) {
            setError('Please enter your Gemini API key above.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setHumanizedText(null);
        setHumanizedAiScore(null);
        setActiveTab('humanizer');

        try {
            setStatusMessage('Humanizing your text...');
            const result = await humanizeText(apiKey, inputText);
            setHumanizedText(result);

            setStatusMessage('Humanization complete! Analyzing new text...');
            const newAnalysis = await detectAIContent(apiKey, result);
            setHumanizedAiScore(newAnalysis.aiScore);

            setStatusMessage('All done!');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setStatusMessage('An error occurred during humanization.');
        } finally {
            setIsLoading(false);
        }
    }, [inputText, apiKey]);
    
    const handleCopy = useCallback(() => {
        if (!humanizedText) return;
        navigator.clipboard.writeText(humanizedText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [humanizedText]);

    const handleDownload = useCallback(() => {
        if (!humanizedText) return;
        const blob = new Blob([humanizedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'humanized-text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [humanizedText]);


    const renderContent = () => {
        if (isLoading) {
            return <Loader message={statusMessage} />;
        }
        if (error) {
            return <div className="text-red-600 font-bold bg-red-100 border-2 border-red-500 p-4 rounded-lg">{error}</div>;
        }
        switch (activeTab) {
            case 'detector':
                return <ResultsDisplay analysisResult={analysisResult} />;
            case 'humanizer':
                if (!humanizedText) return null;

                const copyIconPath = "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z";
                const downloadIconPath = "M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z";

                return (
                     <div className="border-2 border-black rounded-lg p-6 bg-white flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-200">
                             <h2 className="text-xl font-bold">Humanized Text</h2>
                            {humanizedAiScore !== null && (
                                <div className="text-center mx-4">
                                    <p className="text-sm font-bold text-gray-600">New AI Score</p>
                                    <p className={`text-3xl font-bold ${getScoreColor(humanizedAiScore)}`}>
                                        {humanizedAiScore}%
                                    </p>
                                </div>
                            )}
                             <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                <button onClick={handleCopy} title="Copy to clipboard" className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-black border-2 border-black rounded-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] active:shadow-none ${isCopied ? 'bg-green-400' : 'bg-gray-200'}`}>
                                    <Icon path={copyIconPath} className="w-4 h-4" />
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <button onClick={handleDownload} title="Download as .txt" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-black bg-gray-200 border-2 border-black rounded-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] active:shadow-none">
                                    <Icon path={downloadIconPath} className="w-4 h-4" />
                                    Download
                                </button>
                             </div>
                        </div>
                        <div className="overflow-y-auto flex-grow">
                            <p className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">{humanizedText}</p>
                        </div>
                     </div>
                );
            case 'welcome':
            default:
                return (
                    <div className="text-center p-6 border-2 border-black rounded-lg bg-white">
                        <h2 className="text-2xl font-bold">Welcome!</h2>
                        <p className="mt-2 text-gray-600">Paste your text or upload a file to begin. Our advanced analyzer will expose AI traits, and our new humanizer will make it undetectable.</p>
                    </div>
                );
        }
    };


    return (
        <div className="min-h-screen font-sans flex flex-col items-center p-4 md:p-8">
            {showApiInfo && <ApiInfoPanel onClose={() => setShowApiInfo(false)} />}
            <Header />
            <div className="container mx-auto mt-6 w-full max-w-7xl">
                 <div className="mb-6 p-4 bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_#A78BFA]">
                    <label htmlFor="api-key" className="block text-lg font-bold text-black mb-2">
                        Gemini API Key
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => handleApiKeyChange(e.target.value)}
                            placeholder="Paste your API key here..."
                            className="w-full p-3 border-2 border-black rounded-md focus:outline-none focus:ring-4 focus:ring-purple-400 transition-shadow text-base bg-white text-black"
                        />
                        <button onClick={() => setShowApiInfo(true)} title="How to get an API Key" className="p-2 bg-gray-200 border-2 border-black rounded-full hover:bg-gray-300">
                           <Icon path="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
            <main className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {/* Left Panel */}
                <div className="flex flex-col gap-4 p-6 bg-[#fff] border-2 border-black rounded-lg shadow-[8px_8px_0px_#F59E0B]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Your Text</h2>
                         <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:underline font-semibold self-start text-sm flex items-center gap-1">
                            <Icon path="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v-2H5v2z" className="w-5 h-5" />
                            Upload a .txt file
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setAnalysisResult(null);
                            setHumanizedText(null);
                            setHumanizedAiScore(null);
                            setError('');
                            if (activeTab !== 'welcome') {
                                setActiveTab('welcome');
                            }
                        }}
                        placeholder="Paste your content here..."
                        className="w-full h-80 p-4 border-2 border-black rounded-md focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-shadow text-base bg-[#E0D8C5] text-black"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleDetect}
                            disabled={isLoading || !inputText || !apiKey}
                            className="w-full px-6 py-3 font-bold text-white bg-pink-500 border-2 border-black rounded-md transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:shadow-none disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            Detect AI
                        </button>
                        <button
                            onClick={handleHumanize}
                            disabled={isLoading || !inputText || !apiKey}
                            className="w-full px-6 py-3 font-bold text-white bg-blue-600 border-2 border-black rounded-md transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:shadow-none disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            Humanize
                        </button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="p-6 bg-[#fff] border-2 border-black rounded-lg shadow-[8px_8px_0px_#EC4899] flex flex-col min-h-[500px]">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
