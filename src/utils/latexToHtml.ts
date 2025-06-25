// Enhanced LaTeX to HTML converter for resume generation
export interface ParsedResume {
  header: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    website?: string;
    location: string;
  };
  sections: Array<{
    title: string;
    type: 'summary' | 'skills' | 'experience' | 'projects' | 'education';
    content: any;
  }>;
}

export function parseLatexResume(latex: string): ParsedResume {
  // Extract header information
  const headerMatch = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  let header = {
    name: 'TANMAY KAPURE',
    email: 'tk427@njit.edu',
    phone: '+1 (862) 405-2014',
    linkedin: '',
    website: '',
    location: 'New York, NY, USA'
  };

  if (headerMatch) {
    const headerContent = headerMatch[1];
    
    // Extract name
    const nameMatch = headerContent.match(/\\textbf\{\\huge\s+([^}]+)\}/);
    if (nameMatch) header.name = nameMatch[1].trim();
    
    // Extract email
    const emailMatch = headerContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) header.email = emailMatch[0];
    
    // Extract phone
    const phoneMatch = headerContent.match(/\+?1?\s*\(?(\d{3})\)?[-.\s]*(\d{3})[-.\s]*(\d{4})/);
    if (phoneMatch) header.phone = phoneMatch[0];
    
    // Extract LinkedIn
    const linkedinMatch = headerContent.match(/\\href\{([^}]*linkedin[^}]*)\}\{([^}]+)\}/);
    if (linkedinMatch) header.linkedin = linkedinMatch[2];
    
    // Extract website
    const websiteMatch = headerContent.match(/\\href\{([^}]*(?:github|portfolio|website)[^}]*)\}\{([^}]+)\}/);
    if (websiteMatch) header.website = websiteMatch[2];
    
    // Extract location
    const locationMatch = headerContent.match(/([A-Z][a-z]+,\s*[A-Z]{2}(?:,\s*[A-Z]{3})?)/);
    if (locationMatch) header.location = locationMatch[0];
  }

  // Parse sections
  const sections: Array<any> = [];
  const sectionMatches = latex.match(/\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section\*?\{|\\end\{document\}|$)/g);

  if (sectionMatches) {
    sectionMatches.forEach(section => {
      const titleMatch = section.match(/\\section\*?\{([^}]+)\}/);
      const title = titleMatch ? titleMatch[1] : '';
      let sectionContent = section.replace(/\\section\*?\{[^}]+\}/, '').trim();

      if (title.toLowerCase().includes('summary')) {
        // Parse summary
        const content = sectionContent
          .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, '$1')
          .replace(/[{}]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        sections.push({ title, type: 'summary', content });
        
      } else if (title.toLowerCase().includes('skill')) {
        // Parse skills
        const skills: Array<{category: string, items: string}> = [];
        const skillLines = sectionContent.split('\\\\');
        
        skillLines.forEach(line => {
          const skillMatch = line.match(/\\(?:noindent\\)?textbf\{([^}]+)\}:\s*(.+)/);
          if (skillMatch) {
            skills.push({
              category: skillMatch[1].trim(),
              items: skillMatch[2].replace(/\\[a-zA-Z]+/g, '').trim()
            });
          }
        });
        sections.push({ title, type: 'skills', content: skills });
        
      } else {
        // Parse experience/projects/education
        const entries: Array<any> = [];
        
        // Match different patterns for entries
        const patterns = [
          // Work experience pattern
          /\\textbf\{([^}]+)\}\s*\\hfill\s*([^\n\\]+).*?\\textit\{([^}]+)\}\s*\\hfill\s*([^\n\\]+).*?\\begin\{itemize\}(.*?)\\end\{itemize\}/gs,
          // Education pattern
          /\\textbf\{([^}]+)\}\s*\\hfill\s*([^\n\\]+).*?\\textit\{([^}]+)\}\s*\\hfill\s*([^\n\\]+)/g,
          // Project pattern
          /\\textbf\{([^}]+)\}\s*\\hfill\s*(?:\\href\{[^}]+\}\{([^}]+)\}|([^\n\\]+)).*?\\begin\{itemize\}(.*?)\\end\{itemize\}/gs
        ];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(sectionContent)) !== null) {
            let bullets: string[] = [];
            
            if (match[5] || match[4]) {
              const bulletContent = match[5] || match[4] || '';
              bullets = bulletContent
                .replace(/\\item\s*/g, '|||BULLET|||')
                .split('|||BULLET|||')
                .filter(bullet => bullet.trim())
                .map(bullet => bullet
                  .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, '$1')
                  .replace(/[{}]/g, '')
                  .trim()
                );
            }

            entries.push({
              title: match[1] ? match[1].trim() : '',
              date: match[2] ? match[2].trim() : '',
              company: match[3] ? match[3].trim() : '',
              location: match[4] && !match[5] ? match[4].trim() : '',
              link: match[2] && match[2].includes('http') ? match[2] : '',
              bullets: bullets
            });
          }
        }
        
        const type = title.toLowerCase().includes('project') ? 'projects' : 
                    title.toLowerCase().includes('education') ? 'education' : 'experience';
        sections.push({ title, type, content: entries });
      }
    });
  }

  return { header, sections };
}

export function generateResumeHTML(parsedResume: ParsedResume): string {
  const { header, sections } = parsedResume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${header.name} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            line-height: 1.2;
            color: #000;
            background: white;
            margin: 0.4in 0.45in;
            max-width: 8.5in;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15pt;
        }
        
        .name {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 3pt;
        }
        
        .contact {
            font-size: 10pt;
            color: #000;
        }
        
        .contact a {
            color: #0000EE;
            text-decoration: none;
        }
        
        .section {
            margin-bottom: 8pt;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 0.5pt solid #000;
            margin-bottom: 5pt;
            padding-bottom: 1pt;
        }
        
        .summary {
            font-size: 10pt;
            text-align: justify;
            margin-bottom: 8pt;
        }
        
        .skills {
            font-size: 9pt;
        }
        
        .skill-category {
            font-weight: bold;
            display: inline;
            margin-right: 5pt;
        }
        
        .skill-items {
            display: inline;
            margin-bottom: 3pt;
        }
        
        .entry {
            margin-bottom: 6pt;
        }
        
        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 2pt;
        }
        
        .entry-title {
            font-weight: bold;
            font-size: 10pt;
        }
        
        .entry-date {
            font-size: 10pt;
            white-space: nowrap;
        }
        
        .entry-subtitle {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-style: italic;
            font-size: 9pt;
            margin-bottom: 4pt;
        }
        
        .bullets {
            list-style: none;
            padding-left: 0;
        }
        
        .bullets li {
            margin-bottom: 2pt;
            padding-left: 12pt;
            text-indent: -12pt;
            font-size: 9pt;
            line-height: 1.15;
        }
        
        .bullets li:before {
            content: "• ";
            font-weight: bold;
            margin-right: 6pt;
        }
        
        .education-item {
            margin-bottom: 4pt;
        }
        
        .gpa {
            font-weight: normal;
        }
        
        .coursework {
            font-size: 8pt;
            font-style: normal;
            color: #333;
        }
        
        @media print {
            body {
                margin: 0.4in 0.45in;
            }
            
            .section {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${header.name}</div>
        <div class="contact">
            ${[
              header.email,
              header.phone,
              header.linkedin ? `<a href="#">${header.linkedin}</a>` : '',
              header.website ? `<a href="#">${header.website}</a>` : '',
              header.location
            ].filter(Boolean).join(' • ')}
        </div>
    </div>

    ${sections.map(section => {
      switch (section.type) {
        case 'summary':
          return `
            <div class="section">
                <div class="section-title">${section.title}</div>
                <div class="summary">${section.content}</div>
            </div>
          `;
          
        case 'skills':
          return `
            <div class="section">
                <div class="section-title">${section.title}</div>
                <div class="skills">
                    ${section.content.map((skill: any) => `
                        <div>
                            <span class="skill-category">${skill.category}:</span>
                            <span class="skill-items">${skill.items}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
          `;
          
        case 'experience':
        case 'projects':
          return `
            <div class="section">
                <div class="section-title">${section.title}</div>
                ${section.content.map((entry: any) => `
                    <div class="entry">
                        <div class="entry-header">
                            <span class="entry-title">${entry.title}</span>
                            <span class="entry-date">${entry.date}</span>
                        </div>
                        ${entry.company ? `
                            <div class="entry-subtitle">
                                <span>${entry.company}</span>
                                <span>${entry.location}</span>
                            </div>
                        ` : ''}
                        ${entry.bullets.length > 0 ? `
                            <ul class="bullets">
                                ${entry.bullets.map((bullet: string) => `<li>${bullet}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
          `;
          
        case 'education':
          return `
            <div class="section">
                <div class="section-title">${section.title}</div>
                ${section.content.map((entry: any) => `
                    <div class="entry education-item">
                        <div class="entry-header">
                            <span class="entry-title">${entry.title}</span>
                            <span class="entry-date">${entry.date}</span>
                        </div>
                        <div class="entry-subtitle">
                            <span>${entry.company}</span>
                            <span>${entry.location}</span>
                        </div>
                        ${entry.bullets.length > 0 ? `
                            <div class="coursework">${entry.bullets.join(', ')}</div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
          `;
          
        default:
          return '';
      }
    }).join('')}
</body>
</html>
  `;
} 