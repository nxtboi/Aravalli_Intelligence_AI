import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle, Brain, Scan, TrendingUp, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface AnalysisResult {
  ndvi: number;
  status: string;
  nightlight: number;
  isConstruction: boolean;
  isLegal: boolean;
  explanation?: string;
  // New ML fields
  mlConfidence?: number;
  detectedObjects?: { label: string; count: number }[];
  indices?: { evi: number; savi: number };
  prediction?: string;
}

export function AnalysisView() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    maxFiles: 1
  } as any);

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      // 1. Convert file to base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          // 2. Call Gemini for visual analysis
          let geminiExplanation = "Analysis pending...";
          
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                parts: [
                  { inlineData: { mimeType: file.type, data: base64Data } },
                  { text: "Analyze this satellite image for environmental monitoring. Is there deforestation or construction? Be concise." }
                ]
              }
            });
            geminiExplanation = result.text || "No explanation provided.";
          } catch (e) {
            console.error("Gemini analysis failed", e);
            geminiExplanation = "Visual analysis service unavailable. Using statistical simulation.";
          }

          // 3. Call our backend to record the transaction and get simulated sensor data
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              location: "Aravalli Sector " + Math.floor(Math.random() * 100),
              image: preview 
            })
          });
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          const data = await response.json();
          setResult({ ...data, explanation: geminiExplanation });
        } catch (innerError) {
          console.error(innerError);
          setError("Failed to process analysis. Please check your connection and try again.");
        } finally {
          setAnalyzing(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
        setAnalyzing(false);
      };
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred.");
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">New Analysis</h2>
        <p className="text-zinc-500">Upload satellite imagery to detect changes.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-64",
              isDragActive ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
            )}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <p className="font-medium text-zinc-900">Click to upload or drag and drop</p>
                <p className="text-sm text-zinc-500 mt-1">Satellite imagery (TIFF, JPG, PNG)</p>
              </>
            )}
          </div>

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="animate-spin" /> : 'Run Analysis'}
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <FileImage size={18} />
            Analysis Results
          </h3>
          
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 min-h-[200px]">
              <p>No analysis run yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Status</span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium border",
                    result.status === 'Natural' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    result.status === 'Seasonal' ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {result.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">NDVI Score</span>
                  <span className="font-mono font-medium">{result.ndvi.toFixed(3)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Nightlight Intensity</span>
                  <span className="font-mono font-medium">{result.nightlight.toFixed(1)}</span>
                </div>
              </div>

              {result.isConstruction && (
                <div className={cn(
                  "p-4 rounded-lg border",
                  result.isLegal ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={result.isLegal ? "text-blue-600" : "text-red-600"} size={20} />
                    <div>
                      <h4 className={cn("font-medium text-sm", result.isLegal ? "text-blue-900" : "text-red-900")}>
                        Construction Detected
                      </h4>
                      <p className={cn("text-xs mt-1", result.isLegal ? "text-blue-700" : "text-red-700")}>
                        Registry Check: {result.isLegal ? "Authorized Project (ID: Gov-2024-X)" : "NO RECORD FOUND - Potential Illegal Activity"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100">
                <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                  <Brain size={16} className="text-purple-600" />
                  Neural Network Analysis
                </h4>
                
                {result.mlConfidence && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Model Confidence</span>
                      <span className="font-medium text-zinc-900">{(result.mlConfidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full" 
                        style={{ width: `${result.mlConfidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-2 text-purple-700">
                      <Scan size={14} />
                      <span className="text-xs font-semibold uppercase">Object Detection</span>
                    </div>
                    <div className="space-y-1">
                      {result.detectedObjects?.map((obj, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-zinc-600">{obj.label}</span>
                          <span className="font-mono font-medium text-zinc-900">{obj.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-700">
                      <Layers size={14} />
                      <span className="text-xs font-semibold uppercase">Spectral Indices</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">EVI (Enhanced)</span>
                        <span className="font-mono font-medium text-zinc-900">{result.indices?.evi.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">SAVI (Soil Adj)</span>
                        <span className="font-mono font-medium text-zinc-900">{result.indices?.savi.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {result.prediction && (
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex gap-3 items-start">
                    <TrendingUp size={16} className="text-zinc-400 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-500 uppercase block mb-0.5">Predictive Model (12mo)</span>
                      <p className="text-sm text-zinc-700">{result.prediction}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <h4 className="font-semibold text-zinc-900 mb-2">Phenology Analysis</h4>
                <div className="bg-zinc-50 p-3 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">NDVI Trend (6mo):</span>
                    <span className={result.ndvi < 0.3 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                      {result.ndvi < 0.3 ? "Declining" : "Stable/Growing"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Recovery Check:</span>
                    <span className="text-zinc-700">
                      {result.status === 'Permanent Degradation' ? "No recovery detected (Permanent)" : "Vegetation stable/recovered (Natural)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Conclusion:</span>
                    <span className="font-bold text-zinc-900">{result.status}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">AI Assessment</p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 text-zinc-600">
                  Reject
                </button>
                <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                  Confirm Findings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
