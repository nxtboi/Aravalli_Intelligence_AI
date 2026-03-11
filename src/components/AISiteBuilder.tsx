import React, { useState, useEffect, useMemo } from 'react';
import { Wand2, Save, Loader2, FileText, Check, X, History, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createPatch } from 'diff';

interface Change {
  path: string;
  original: string;
  updated: string;
}

interface PromptHistoryItem {
  id: number;
  prompt: string;
}

export function AISiteBuilder() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Change[] | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/admin/files')
      .then(res => res.json())
      .then(data => setAvailableFiles(data.files || []))
      .catch(() => setStatus('Error: Could not fetch file list.'));
    
    fetchPromptHistory();
  }, []);

  const fetchPromptHistory = () => {
    fetch('/api/admin/prompt-history')
      .then(res => res.json())
      .then(data => setPromptHistory(data.prompts || []))
      .catch(() => setStatus('Error: Could not fetch prompt history.'));
  };

  const savePromptToHistory = async (promptToSave: string) => {
    try {
      await fetch('/api/admin/prompt-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSave })
      });
      fetchPromptHistory(); // Refresh history after saving
    } catch (error) {
      console.error('Failed to save prompt', error);
    }
  };

  const handleGenerate = async () => {
    const currentPrompt = prompt;
    if (!currentPrompt.trim()) {
      setStatus('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setStatus('AI is analyzing your request...');
    setPendingChanges(null);
    setPreviewFile(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is missing.");
      const ai = new GoogleGenAI({ apiKey });

      // Step 1: AI selects which files to edit
      setStatus('AI is selecting relevant files...');
      const selectionPrompt = `
        You are a senior React developer analyzing a project codebase.
        The user wants to make a change. Your task is to identify which files need to be edited.
        User Prompt: "${currentPrompt}"
        
        Available Files:
        ${JSON.stringify(availableFiles, null, 2)}

        Analyze the user's prompt and the file list, and decide which files are necessary to modify.
        Return ONLY a JSON object with a single key "files" that is an array of the file paths.
        Example: { "files": ["src/components/Sidebar.tsx", "src/App.tsx"] }
      `;

      const selectionResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: selectionPrompt,
        config: { responseMimeType: 'application/json' }
      });

      const selectionJson = JSON.parse(selectionResponse.text || '{}');
      const targetFiles: string[] = selectionJson.files || [];

      if (targetFiles.length === 0) {
        throw new Error("AI could not identify any files to edit for this request.");
      }

      setStatus(`AI selected ${targetFiles.length} files. Reading content...`);

      // Step 2: Read the content of the selected files
      const fileContents: Record<string, string> = {};
      for (const file of targetFiles) {
        const readRes = await fetch('/api/admin/read-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: file })
        });
        if (!readRes.ok) throw new Error(`Failed to read ${file}`);
        const { content } = await readRes.json();
        fileContents[file] = content;
      }

      // Step 3: Generate new code based on the selected files
      setStatus(`Generating new code for ${targetFiles.length} files...`);
      const codePrompt = `
        You are an expert React developer. Your task is to modify the following code files based on the user's request.
        User Request: "${currentPrompt}"
        
        Current Code:
        ${Object.entries(fileContents).map(([path, code]) => `
FILE: ${path}
\`\`\`
${code}
\`\`\`
`).join('\n')}
        
        Return a JSON object where keys are the file paths and values are the COMPLETE updated source code for that file.
        Ensure the code is complete and functional. Only include files that you have modified.
        Return ONLY the JSON.
      `;

      const codeResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: codePrompt,
        config: { responseMimeType: 'application/json' }
      });

      const newCodeJson = JSON.parse(codeResponse.text || '{}');
      if (Object.keys(newCodeJson).length === 0) {
        throw new Error("AI did not suggest any code changes.");
      }

      const changes: Change[] = Object.entries(newCodeJson).map(([path, updatedCode]) => ({
        path,
        original: fileContents[path],
        updated: updatedCode as string,
      }));

      setPendingChanges(changes);
      setPreviewFile(changes[0]?.path || null);
      setStatus(`Preview generated for ${changes.length} files. Review the suggested changes below.`);
      await savePromptToHistory(currentPrompt);

    } catch (error: any) {
      console.error("Builder error:", error);
      setStatus(`Error: ${error.message || "An unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!pendingChanges) return;
    setLoading(true);
    setStatus('Applying changes...');

    try {
      let successCount = 0;
      for (const change of pendingChanges) {
        const writeRes = await fetch('/api/admin/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: change.path, content: change.updated })
        });
        if (!writeRes.ok) throw new Error(`Failed to write to ${change.path}`);
        successCount++;
      }
      setStatus(`Successfully updated ${successCount} files! Reloading...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentDiff = useMemo(() => {
    if (!pendingChanges || !previewFile) return null;
    const change = pendingChanges.find(c => c.path === previewFile);
    if (!change) return null;
    return createPatch(change.path, change.original, change.updated);
  }, [pendingChanges, previewFile]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">AI Site Builder</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Control Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2"><BrainCircuit size={16}/> Describe the change you want the AI to make</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Change the primary button color to a vibrant orange'"
              className="w-full h-28 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
            <div className="mt-4">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                Generate Preview
              </button>
            </div>
            {status && <p className={`text-sm mt-4 ${status.includes('Error') ? 'text-red-600' : 'text-zinc-600'}`}>{status}</p>}
          </div>
        </div>

        {/* Prompt History */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2"><History size={16}/> Prompt History</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {promptHistory.map(item => (
              <button 
                key={item.id} 
                onClick={() => setPrompt(item.prompt)}
                className="w-full text-left p-3 rounded-lg text-sm bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 truncate">
                {item.prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview & Commit */}
      {pendingChanges && previewFile && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
            <div className="flex gap-2 overflow-x-auto">
              {pendingChanges.map(change => (
                <button
                  key={change.path}
                  onClick={() => setPreviewFile(change.path)}
                  className={`px-3 py-1 text-xs rounded-md flex items-center gap-2 transition-colors ${
                    previewFile === change.path ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileText size={12} />
                  {change.path.replace('src/', '')}
                </button>
              ))}
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} /> View Changes</span>
          </div>
          <pre className="w-full h-96 bg-zinc-950 text-zinc-300 font-mono text-sm p-4 overflow-auto resize-y">
            {currentDiff?.split('\n').map((line, i) => {
              let color = 'text-zinc-400';
              if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-green-400';
              if (line.startsWith('-') && !line.startsWith('---')) color = 'text-red-400';
              if (line.startsWith('@@')) color = 'text-cyan-400';
              return <div key={i} className={color}>{line}</div>;
            })}
          </pre>
        </div>
      )}
      {pendingChanges && (
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-zinc-200">
          <button 
            onClick={() => setPendingChanges(null)} 
            className="text-zinc-600 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 flex items-center gap-2">
            <X size={18}/>
            Discard
          </button>
          <button 
            onClick={handleApply} 
            disabled={loading}
            className="bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={18}/>
            Commit Changes
          </button>
        </div>
      )}

    </div>
  );
}
