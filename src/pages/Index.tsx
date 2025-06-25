import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { parseLatexResume, generateResumeHTML } from "@/utils/latexToHtml";
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

const GEMINI_MODEL = "gemini-2.5-flash";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [originalResume, setOriginalResume] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const { toast } = useToast();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Auto-load resume on component mount
  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await fetch('/resume.tex');
        if (response.ok) {
          const resumeContent = await response.text();
          setOriginalResume(resumeContent);
          toast({
            title: "Resume Loaded",
            description: "Your personal resume has been loaded successfully!",
          });
        } else {
          throw new Error('Resume file not found');
        }
      } catch (error) {
        console.error('Error loading resume:', error);
        toast({
          title: "Resume Not Found",
          description: "Please add your resume.tex file to the public folder.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingResume(false);
      }
    };

    loadResume();
  }, [toast]);

  // Function to extract company name from job description
  const extractCompanyName = (jobDesc: string): string => {
    // Common patterns to find company names
    const patterns = [
      /(?:at|@)\s+([A-Z][a-zA-Z\s&.,-]+?)(?:\s|,|\.|$)/i,
      /Company:\s*([A-Z][a-zA-Z\s&.,-]+?)(?:\s|,|\.|$)/i,
      /Organization:\s*([A-Z][a-zA-Z\s&.,-]+?)(?:\s|,|\.|$)/i,
      /([A-Z][a-zA-Z\s&.,-]+?)\s+is\s+(?:seeking|looking|hiring)/i,
      /Join\s+([A-Z][a-zA-Z\s&.,-]+?)(?:\s|,|\.|$)/i,
      /([A-Z][a-zA-Z\s&.,-]+?)\s+team/i
    ];

    for (const pattern of patterns) {
      const match = jobDesc.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim()
          .replace(/[^\w\s&.-]/g, '') // Remove special chars except &, ., -
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        if (company.length > 2 && company.length < 50) {
          return company;
        }
      }
    }
    
    // Fallback: look for capitalized words at the beginning
    const lines = jobDesc.split('\n');
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const words = line.trim().split(/\s+/);
      for (let i = 0; i < Math.min(3, words.length); i++) {
        const word = words[i].replace(/[^\w]/g, '');
        if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
          return word;
        }
      }
    }
    
    return "Company";
  };

  // Function to extract job role from job description
  const extractJobRole = (jobDesc: string): string => {
    // Common patterns to find job roles
    const patterns = [
      /(?:role|position|job|title|opening):\s*([A-Z][a-zA-Z\s&-]+?)(?:\s|,|\.|$)/i,
      /(?:hiring|seeking|looking for)(?:\s+an?\s+)?([A-Z][a-zA-Z\s&-]+?)(?:\s|,|\.|$)/i,
      /([A-Z][a-zA-Z\s&-]+?)\s+(?:role|position|job|opening)/i,
      /^([A-Z][a-zA-Z\s&-]+?)(?:\s-\s|\s@\s|\sat\s)/i,
      /We are looking for (?:an?\s+)?([A-Z][a-zA-Z\s&-]+?)(?:\s|,|\.|$)/i,
      /Join our team as (?:an?\s+)?([A-Z][a-zA-Z\s&-]+?)(?:\s|,|\.|$)/i
    ];

    for (const pattern of patterns) {
      const match = jobDesc.match(pattern);
      if (match && match[1]) {
        const role = match[1].trim()
          .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        if (role.length > 2 && role.length < 40) {
          return role;
        }
      }
    }
    
    // Fallback: look for common job titles in the first few lines
    const commonRoles = [
      'Software Engineer', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer',
      'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
      'Product Manager', 'Data Analyst', 'Research Scientist', 'Senior Software Engineer',
      'Software Developer', 'Web Developer', 'Mobile Developer', 'Cloud Engineer',
      'System Administrator', 'Database Administrator', 'Security Engineer'
    ];
    
    const firstLines = jobDesc.split('\n').slice(0, 5).join(' ').toLowerCase();
    for (const role of commonRoles) {
      if (firstLines.includes(role.toLowerCase())) {
        return role;
      }
    }
    
    return "Software Engineer"; // Default fallback
  };

  // Enhanced HTML-to-PDF generation for complete and accurate resumes
  const generateResumePDF = async (autoGenerate = false) => {
    if (!tailoredResume) {
      toast({
        title: "No Resume to Export",
        description: "Please tailor your resume first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const company = companyName || extractCompanyName(jobDescription);
      const jobRole = extractJobRole(jobDescription);

      // Parse LaTeX to structured data
      const parsedResume = parseLatexResume(tailoredResume);
      
      // Generate HTML
      const htmlContent = generateResumeHTML(parsedResume);
      
      // Create a temporary iframe to render HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '8.5in';
      iframe.style.height = '11in';
      document.body.appendChild(iframe);
      
      // Write HTML content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }
      
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
             // Use html2canvas to capture the content
       if (typeof window !== 'undefined' && (window as any).html2canvas) {
         const canvas = await (window as any).html2canvas(iframeDoc.body, {
          width: 612, // 8.5 inches * 72 DPI
          height: 792, // 11 inches * 72 DPI
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        // Create PDF from canvas
        const pdf = new jsPDF('p', 'pt', [612, 792]);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 612, 792);
        
        // Generate filename
        const cleanCompany = company.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const cleanRole = jobRole.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const fileName = `${cleanCompany}_${cleanRole}_Tanmay_Kapure.pdf`;
        
        // Save PDF
        pdf.save(fileName);
        
        // Clean up
        document.body.removeChild(iframe);
        
        if (!autoGenerate) {
          toast({
            title: "Professional Resume PDF Generated!",
            description: `${fileName} has been saved to your downloads folder.`,
          });
        }
        
        return fileName;
      } else {
        // Fallback: Load html2canvas dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = async () => {
          const canvas = await (window as any).html2canvas(iframeDoc.body, {
            width: 612,
            height: 792,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const pdf = new jsPDF('p', 'pt', [612, 792]);
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, 612, 792);
          
          const cleanCompany = company.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
          const cleanRole = jobRole.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
          const fileName = `${cleanCompany}_${cleanRole}_Tanmay_Kapure.pdf`;
          
          pdf.save(fileName);
          document.body.removeChild(iframe);
          
          if (!autoGenerate) {
            toast({
              title: "Professional Resume PDF Generated!",
              description: `${fileName} has been saved to your downloads folder.`,
            });
          }
        };
        document.head.appendChild(script);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Please try again or copy the LaTeX code manually.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste the job description to generate a cover letter.",
        variant: "destructive",
      });
      return;
    }

    if (!originalResume.trim()) {
      toast({
        title: "Resume Not Loaded",
        description: "Please ensure your resume.tex file is in the public folder.",
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
        const renderTextWithBold = (text: string, startY: number, endY: number) => {
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
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste the job description to tailor your resume.",
        variant: "destructive",
      });
      return;
    }

    if (!originalResume.trim()) {
      toast({
        title: "Resume Not Loaded",
        description: "Please ensure your resume.tex file is in the public folder.",
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
    
    const prompt = `You are an expert technical resume editor and a master of LaTeX. Your task is to revise the 'Summary', 'Work Experience', 'Technologies/Skills', and 'Projects' sections of the provided LaTeX resume to perfectly align with the target job description while ensuring it stays EXACTLY ONE PAGE.

Follow these CRITICAL rules:
1.  **Edit, Do Not Invent:** Work strictly with the content provided. Do not invent new job roles or experiences.
2.  **ONE PAGE LIMIT:** The resume MUST fit on exactly one page. This is non-negotiable.
3.  **Line Length Constraint:** Each bullet point should be 110-120 characters to fully utilize the line space. NO BULLET POINT should wrap to a second line.
4.  **SUMMARY SECTION - SPECIAL RULES:**
    - The summary MUST be 2-3 lines (not shortened)
    - Start with the exact job title from the job description (e.g., "AI Engineer with...", "Data Scientist with...", "Software Engineer with...")
    - Include relevant keywords from the job description
    - Highlight years of experience and key technical skills matching the role
    - Make it keyword-rich for ATS optimization
5.  **Concise & Impactful:** Each bullet point should be concise yet impactful, containing only the most relevant information.
6.  **Quantify Achievements:** Every bullet point must include a specific, quantifiable metric (e.g., "40% improvement", "500K+ users", "30% faster").
7.  **Revise All Sections:** You must revise all four sections: 'Summary', 'Work Experience', 'Technologies/Skills', and 'Projects'.
8.  **Preserve LaTeX:** Do not alter any LaTeX structure, formatting commands, or layout.
9.  **Smart Summarization:** If content is too long, intelligently summarize while keeping the most relevant skills/experiences for the job.
10. **Maximum Content Limits:**
    - Summary: EXACTLY 2-3 lines, keyword-rich, with job title from description
    - Work Experience: Maximum 3-4 bullet points per role
    - Projects: Maximum 2-3 bullet points per project
    - Skills: Keep concise, group related technologies
11. **Output Raw Text:** Return only the complete, updated LaTeX resume code. Do not include markdown, explanations, or any extra text.

CRITICAL: Aim for 100-110 characters in each bullet point to maximize line utilization. Ensure no line exceeds 115 characters to prevent wrapping while preserving impact and metrics.

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
        // Extract company name and job role for PDF filename
        const extractedCompany = extractCompanyName(jobDescription);
        const extractedRole = extractJobRole(jobDescription);
        setCompanyName(extractedCompany);
        
        // Auto-generate PDF after successful tailoring
        setTimeout(async () => {
          const fileName = await generateResumePDF(true); // true = auto-generate mode
          if (fileName) {
            toast({
              title: "Resume Tailored & PDF Generated!",
              description: `Your resume has been optimized for ${extractedCompany} (${extractedRole}). PDF saved: ${fileName}`,
              duration: 6000,
            });
          }
        }, 500); // Small delay to ensure state updates
        
        toast({
          title: "Resume Processing Complete!",
          description: `Tailoring for ${extractedCompany} - ${extractedRole}. Generating PDF...`,
          duration: 3000,
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
              <p className="text-gray-600 mt-1">Personal AI resume optimizer - Just paste job description and get tailored resume!</p>
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

        {/* Resume Status */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Personal Resume Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingResume ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading your resume...</span>
                </div>
              ) : originalResume ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-600">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Resume loaded successfully!</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    File: <code className="bg-gray-100 px-2 py-1 rounded">/public/resume.tex</code> • 
                    Characters: {originalResume.length}
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Click to view loaded resume
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-x-auto max-h-40">
                      {originalResume}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-600">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Resume not found</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Please add your <code className="bg-gray-100 px-2 py-1 rounded">resume.tex</code> file to the <code className="bg-gray-100 px-2 py-1 rounded">/public</code> folder
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Job Description Input */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Job Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste the job description here and click 'Tailor Resume' to get your optimized resume..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[300px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <div className="mt-3 text-sm text-gray-500">
                Characters: {jobDescription.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-8 flex justify-center items-center gap-4">
          <Button
            onClick={handleTailorResume}
            disabled={isLoading || isGeneratingCoverLetter || !originalResume || isLoadingResume}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Tailoring Resume...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Tailor My Resume
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateCoverLetter}
            disabled={isLoading || isGeneratingCoverLetter || !originalResume || isLoadingResume}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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

        {/* Company Name Display */}
        {companyName && companyName !== "Company" && (
          <div className="text-center mb-4">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              🏢 Detected Company: {companyName}
            </Badge>
          </div>
        )}

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
                      <ExportButtons 
                        content={tailoredResume} 
                        filename="tailored-resume" 
                        onGeneratePDF={generateResumePDF}
                      />
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
