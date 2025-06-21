
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface DiffViewerProps {
  original: string;
  modified: string;
}

export const DiffViewer = ({ original, modified }: DiffViewerProps) => {
  const diffResult = useMemo(() => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    // Simple diff algorithm - finds changed sections
    const changes = [];
    let i = 0, j = 0;
    
    while (i < originalLines.length || j < modifiedLines.length) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[j] || '';
      
      if (origLine === modLine) {
        changes.push({ type: 'unchanged', content: origLine, originalLine: i + 1, modifiedLine: j + 1 });
        i++;
        j++;
      } else {
        // Look for the next matching line
        let nextMatch = -1;
        for (let k = j + 1; k < modifiedLines.length && k < j + 10; k++) {
          if (originalLines[i] === modifiedLines[k]) {
            nextMatch = k;
            break;
          }
        }
        
        if (nextMatch !== -1) {
          // Lines were added
          for (let k = j; k < nextMatch; k++) {
            changes.push({ type: 'added', content: modifiedLines[k], modifiedLine: k + 1 });
          }
          j = nextMatch;
        } else {
          // Look for matching line in original
          let nextOrigMatch = -1;
          for (let k = i + 1; k < originalLines.length && k < i + 10; k++) {
            if (originalLines[k] === modifiedLines[j]) {
              nextOrigMatch = k;
              break;
            }
          }
          
          if (nextOrigMatch !== -1) {
            // Lines were removed
            for (let k = i; k < nextOrigMatch; k++) {
              changes.push({ type: 'removed', content: originalLines[k], originalLine: k + 1 });
            }
            i = nextOrigMatch;
          } else {
            // Line was modified
            changes.push({ type: 'removed', content: origLine, originalLine: i + 1 });
            changes.push({ type: 'added', content: modLine, modifiedLine: j + 1 });
            i++;
            j++;
          }
        }
      }
    }
    
    return changes;
  }, [original, modified]);

  const stats = useMemo(() => {
    const added = diffResult.filter(change => change.type === 'added').length;
    const removed = diffResult.filter(change => change.type === 'removed').length;
    const unchanged = diffResult.filter(change => change.type === 'unchanged').length;
    
    return { added, removed, unchanged };
  }, [diffResult]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Badge variant="outline" className="text-green-600 border-green-200">
          +{stats.added} additions
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-200">
          -{stats.removed} deletions
        </Badge>
        <Badge variant="outline" className="text-gray-600 border-gray-200">
          {stats.unchanged} unchanged
        </Badge>
      </div>
      
      <div className="bg-gray-50 rounded-lg border overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b">
          <h4 className="font-semibold text-gray-700">Code Diff</h4>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {diffResult.map((change, index) => (
            <div
              key={index}
              className={`px-4 py-1 font-mono text-sm ${
                change.type === 'added'
                  ? 'bg-green-50 text-green-800 border-l-4 border-green-400'
                  : change.type === 'removed'
                  ? 'bg-red-50 text-red-800 border-l-4 border-red-400'
                  : 'text-gray-700'
              }`}
            >
              <span className="text-gray-400 mr-4 select-none">
                {change.type === 'added' && '+'}
                {change.type === 'removed' && '-'}
                {change.type === 'unchanged' && ' '}
              </span>
              <span className="whitespace-pre-wrap">{change.content}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p><strong>What changed:</strong> The AI has optimized your Work Experience, Projects, and Skills sections using the X-Y-Z framework, ensuring every bullet point includes quantifiable metrics and aligns with the job description requirements.</p>
      </div>
    </div>
  );
};
