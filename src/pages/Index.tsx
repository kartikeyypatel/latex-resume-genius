import { useState } from "react";
import { jsPDF } from "jspdf";
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

const GEMINI_MODEL = "gemini-2.0-flash";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [originalResume, setOriginalResume] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const { toast } = useToast();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim() || !originalResume.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job description and resume code.",
        variant: "destructive",
      });
      return;
    }
  
    setIsGeneratingCoverLetter(true);

    const coverLetterPrompt = `You are a professional technical recruiter and expert resume writer. Your task is to write a highly tailored, ATS-optimized cover letter for a software engineering role, based on a given job description and the applicant's resume.

Please follow these exact instructions and structure:

INPUTS:
1. Job Description: ${jobDescription}
2. Resume: ${originalResume}

OBJECTIVE:
Generate a concise, compelling, and customized cover letter that directly aligns the applicant's experience with the job requirements. This letter should convince the hiring team that the applicant is a strong fit for the role and company.

STRICT RULES:
- Do NOT summarize the resume. Instead, **select relevant experiences, skills, and impact** from the resume that align closely with the job description.
- Use a formal, confident, and human tone — professional but never robotic.
- Ensure that the content is **clear, easy to read, and ATS-friendly** (avoid graphics, tables, or unusual formatting).
- Use standard business formatting:
    • Start with date, recipient name (if known), company, and address (if given)
    • 3-body paragraph structure:
        1. Hook + why you're excited about the role/company
        2. What you bring (highlight 2–3 specific experiences/projects that match the JD)
        3. Why you're a great long-term fit + your enthusiasm to contribute
    • Close with a professional sign-off.

REQUIREMENTS:
- Mention the job title and company name early in the first paragraph
- Clearly explain how the applicant's background matches key responsibilities or qualifications from the job description
- Quantify results wherever possible (e.g., "reduced latency by 40%", "built systems used by 500K+ users")
- Use varied action verbs and avoid generic filler phrases
- **Highlight key skills and technologies** that align with the job description by wrapping them in double asterisks (e.g., \`**React**\`, \`**Node.js**\`). This will be used for bolding.
- Limit the length to under 350 words and keep it on one page
- Avoid repeating bullet points or copy-pasting resume lines
- Output should be a clean, ready-to-submit plain text cover letter

FINAL OUTPUT FORMAT:
- Do not include markdown, HTML, or explanation
- Return **only** the cover letter content (no commentary)

Now, generate the cover letter using the resume and job description provided.`;

    try {
      const response = await fetch(`/api/v1beta/models/${GEMINI_MODEL}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: coverLetterPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Could not parse error body' }));
        console.error('API Error Body:', errorBody);
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a bit or check your Google AI Studio account for usage limits.');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const result = data.candidates[0].content.parts[0].text;
        
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const FONT_SIZE_NORMAL = 10.5;
        const FONT_SIZE_HEADER = 14;
        const LINE_HEIGHT = 6.5;
        const MARGIN = 20;
        const usableWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;
        let yPos = MARGIN;

        // --- Header (Your Name & Info) ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT_SIZE_HEADER);
        doc.text("Kartikey Patel", MARGIN, yPos);
        yPos += LINE_HEIGHT;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Newark, NJ | kartikey.patel1398@gmail.com | (862) 423-7020", MARGIN, yPos);
        yPos += LINE_HEIGHT * 2; // Extra space after header

        // --- Date ---
        doc.setFontSize(FONT_SIZE_NORMAL);
        doc.text(today, MARGIN, yPos);
        yPos += LINE_HEIGHT * 3;

        // --- Body with Bold Parsing ---
        const renderTextWithBold = (text: string, startY: number) => {
          let currentY = startY;
          const textLines = doc.splitTextToSize(text, usableWidth);
          doc.setFontSize(FONT_SIZE_NORMAL);

          textLines.forEach((line: string) => {
            if (currentY > 280) { // Primitive page break check
              return;
            }
            let currentX = MARGIN;
            const parts = line.split('**');

            parts.forEach((part, index) => {
              const isBold = index % 2 === 1;
              doc.setFont("helvetica", isBold ? "bold" : "normal");
              doc.text(part, currentX, currentY);
              currentX += doc.getStringUnitWidth(part) * doc.getFontSize() / doc.internal.scaleFactor;
            });
            currentY += LINE_HEIGHT;
          });
          return currentY;
        };

        renderTextWithBold(result, yPos);
        
        doc.save('Kartikey Patel - Cover Letter.pdf');

        toast({
          title: "Cover Letter Generated!",
          description: "Your cover letter has been downloaded.",
        });
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate cover letter.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim() || !originalResume.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job description and LaTeX resume code.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      toast({
        title: "API Key Missing",
        description: "Please set your VITE_GEMINI_API_KEY in .env.local file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const prompt = `You are an expert technical resume editor and a master of LaTeX. Your task is to revise the 'Work Experience', 'Technologies/Skills', and 'Projects' sections of the provided LaTeX resume to perfectly align with the target job description.

Follow these strict rules:
1.  **Edit, Do Not Invent:** Work strictly with the content provided. Do not invent new job roles or experiences.
2.  **Quantify Achievements:** Every bullet point must include a specific, quantifiable metric (e.g., percentage improvements, number of users, time saved).
3.  **Revise All Sections:** You must revise all three sections: 'Work Experience', 'Technologies/Skills', and 'Projects'.
4.  **Preserve LaTeX:** Do not alter any LaTeX structure, formatting commands, or layout.
5.  **Output Raw Text:** Return only the complete, updated LaTeX resume code. Do not include markdown, explanations, or any extra text.

Job Description:
${jobDescription}

LaTeX Resume:
${originalResume}`;

    try {
      const response = await fetch(`/api/v1beta/models/${GEMINI_MODEL}:generateContent`, {
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
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Could not parse error body' }));
        console.error('API Error Body:', errorBody);

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a bit or check your Google AI Studio account for usage limits.');
        }

        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        setTailoredResume(resultText);
        toast({
          title: "Resume Tailored Successfully!",
          description: "Your resume has been optimized for the job description.",
        });
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error: any) {
      console.error('Error tailoring resume:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to tailor resume. Please check your API key and try again.",
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
              <p className="text-gray-600 mt-1">AI-powered LaTeX resume optimization using {GEMINI_MODEL}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Key Input */}
        {(!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span>Gemini API Key</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 mt-2">
                This app uses the Gemini API. Please set your API key in a <code>.env.local</code> file in the root of the project.
                <br />
                Create a file named <code>.env.local</code> and add the following line:
                <br />
                <code className="bg-amber-100 p-1 rounded">VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE</code>
              </p>
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
        )}

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

        {/* Action Buttons */}
        <div className="text-center mb-8 flex justify-center items-center gap-4">
          <Button
            onClick={handleTailorResume}
            disabled={isLoading || isGeneratingCoverLetter}
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

          <Button
            onClick={handleGenerateCoverLetter}
            disabled={isLoading || isGeneratingCoverLetter}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGeneratingCoverLetter ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        {tailoredResume && (
          <>
            <Card className="shadow-xl border-0 mb-8">
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
          </>
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
