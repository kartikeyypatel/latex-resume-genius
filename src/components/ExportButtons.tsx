
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, FileDown } from "lucide-react";

interface ExportButtonsProps {
  content: string;
  filename: string;
  onGeneratePDF?: () => void;
}

export const ExportButtons = ({ content, filename, onGeneratePDF }: ExportButtonsProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Resume code copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = () => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.tex`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded!",
        description: `${filename}.tex has been downloaded.`,
      });
    } catch (error) {
      console.error('Failed to download file:', error);
      toast({
        title: "Download Failed",
        description: "Please try again or copy the text manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        onClick={copyToClipboard}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Copy className="h-4 w-4" />
        <span>Copy Code</span>
      </Button>
      <Button
        onClick={downloadFile}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Export .tex</span>
      </Button>
      {onGeneratePDF && (
        <Button
          onClick={onGeneratePDF}
          variant="default"
          size="sm"
          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
        >
          <FileDown className="h-4 w-4" />
          <span>Download PDF</span>
        </Button>
      )}
    </div>
  );
};
