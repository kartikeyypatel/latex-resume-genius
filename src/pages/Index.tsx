
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DiffViewer } from "@/components/DiffViewer";
import { ExportButtons } from "@/components/ExportButtons";
import { Loader2, FileText, Target, Zap } from "lucide-react";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [originalResume, setOriginalResume] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleTailorResume = async () => {
    if (!jobDescription.trim() || !originalResume.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job description and LaTeX resume code.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const prompt = `You are an expert technical resume editor and a master of LaTeX, specializing in the X-Y-Z framework for crafting compelling, quantified achievements.

Your Task: Revise the 'Work Experience', 'Technologies/Skills', and 'Projects' sections of the provided LaTeX resume to perfectly align with the target job description. You must follow these strict rules:

Rule 1: Apply the X-Y-Z Formula
Every bullet must follow the format:
Accomplished [X] as measured by [Y], by doing [Z]

Example: Reduced application response times (X) by 30% (Y) by engineering Python Flask APIs and deploying them on AWS Lambda (Z).

Rule 2: Quantify Everything
Every bullet point must include a quantifiable metric (%, users, time, $).

Rule 3: Only Edit Specified Sections
- Modify only 'Work Experience', 'Technologies/Skills', and 'Projects'.
- In Technologies/Skills, add missing keywords relevant to the JD. Do not remove existing ones.
- Do not touch Education, Summary, Contact, or any layout/formatting code.

Rule 4: Preserve LaTeX Formatting & One-Page Layout
- Do not change any LaTeX structure, commands, or formatting.
- Output must be valid LaTeX code that compiles without errors.

Rule 5: Output Format
Only return the final updated LaTeX code. No markdown, no comments, no explanations.

Job Description:
${jobDescription}

LaTeX Resume:
${originalResume}`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const result = data.candidates[0].content.parts[0].text;
        setTailoredResume(result);
        toast({
          title: "Resume Tailored Successfully!",
          description: "Your resume has been optimized for the job description.",
        });
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error('Error tailoring resume:', error);
      toast({
        title: "Error",
        description: "Failed to tailor resume. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Tailor Pro</h1>
              <p className="text-gray-600 mt-1">AI-powered LaTeX resume optimization using Gemini 1.5 Pro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Key Input */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <span>Gemini API Key</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your Gemini API key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="min-h-[60px] bg-white border-amber-200 focus:border-amber-400"
            />
            <p className="text-sm text-amber-700 mt-2">
              Get your free API key from{" "}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-amber-800"
              >
                Google AI Studio
              </a>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Job Description Input */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Job Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[300px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <div className="mt-3 text-sm text-gray-500">
                Characters: {jobDescription.length}
              </div>
            </CardContent>
          </Card>

          {/* LaTeX Resume Input */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>LaTeX Resume Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste your LaTeX resume code from Overleaf here..."
                value={originalResume}
                onChange={(e) => setOriginalResume(e.target.value)}
                className="min-h-[300px] resize-none font-mono text-sm border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              />
              <div className="mt-3 text-sm text-gray-500">
                Characters: {originalResume.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tailor Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleTailorResume}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Tailoring Resume...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Tailor Resume
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        {tailoredResume && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Updated LaTeX Resume Code</CardTitle>
                <Badge variant="secondary" className="bg-white text-green-600">
                  Optimized
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="result" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="result">Final Result</TabsTrigger>
                  <TabsTrigger value="diff">Before & After</TabsTrigger>
                </TabsList>
                
                <TabsContent value="result" className="p-6">
                  <div className="space-y-4">
                    <ExportButtons content={tailoredResume} filename="tailored-resume" />
                    <Separator />
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 max-h-96 overflow-y-auto">
                        {tailoredResume}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="diff" className="p-6">
                  <DiffViewer 
                    original={originalResume} 
                    modified={tailoredResume}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Optimization</h3>
            <p className="text-gray-600">Uses Gemini 1.5 Pro to intelligently tailor your resume to specific job requirements</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">LaTeX Preservation</h3>
            <p className="text-gray-600">Maintains all formatting and structure while optimizing content for maximum impact</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">X-Y-Z Framework</h3>
            <p className="text-gray-600">Transforms bullet points using proven quantified achievement formats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
