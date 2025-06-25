# 🚀 Personal Resume Setup Instructions

## Quick Setup (3 Steps)

### 1. Replace Your Resume
- Replace the file `/public/resume.tex` with your actual LaTeX resume
- Make sure it's named exactly `resume.tex`
- The app will automatically load it when you refresh

### 2. Set API Key
- Create a `.env.local` file in the root folder
- Add your Gemini API key:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```
- Get free API key from: https://aistudio.google.com/app/apikey

### 3. Use the App
- Just paste any job description
- Click "Tailor My Resume" 
- Download your optimized PDF!

## 🎯 How It Works

1. **Auto-loads your resume** from `/public/resume.tex`
2. **Paste job description** → AI detects company name
3. **Click "Tailor My Resume"** → Gets 1-page optimized resume
4. **Download PDF** → `{Company}_Resume_Your_Name.pdf`

## 📁 File Structure
```
your-project/
├── public/
│   └── resume.tex          ← Your personal resume (REPLACE THIS)
├── .env.local              ← Your API key (CREATE THIS)
└── ...
```

## ✨ Features
- **Smart summary tailoring** with job title from description
- **1-page guarantee** with optimized bullet points (110-120 chars)
- **Company-based PDF naming** 
- **ATS optimization** with relevant keywords
- **Cover letter generation**

## 🔧 Troubleshooting

**Resume not loading?**
- Check file is named exactly `resume.tex` in `/public/` folder
- Refresh the page

**API errors?**
- Verify your `.env.local` file exists and has correct API key
- Make sure you have Gemini API credits

**PDF generation issues?**
- Check browser allows downloads
- Try different browsers if needed

---
Now you have your personal resume optimizer! 🎉 