# ⚡ Speed Force

A fast, modern typing speed test app built with React.

## 🎮 Features

- **Multiple Modes**: Time-based, word count, or custom text
- **Real-time Stats**: WPM, accuracy, and progress tracking
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Theme**: Easy on the eyes
- **High Score Tracking**: Local storage saves your best WPM

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── App.jsx           # Main app (UI + game logic)
├── api.js            # Quote fetching API
├── main.jsx          # Entry point
├── index.css         # Global styles
└── components/
    ├── TypingArea.jsx    # Typing input display
    ├── Results.jsx       # Stats after test
    └── RainBackground.jsx # Visual effects

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide Icons

## 📝 Environment Variables

Create `.env.local` file:
QUOTES_API_KEY=your_api_key_here