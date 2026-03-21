# Frontend – Project Flow

A modern frontend built with **React** and **Tailwind CSS**, powered by **Vite**.

---

## 🧰 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [React](https://react.dev/) | 19 | UI library |
| [Vite](https://vite.dev/) | 8 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first CSS framework |

---

## 📁 Project Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── App.jsx         # Root component & routing
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles (Tailwind import)
├── index.html          # HTML entry point
├── vite.config.js      # Vite + Tailwind plugin config
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# From the project root, navigate to the frontend folder
cd frontend

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 🎨 Using Tailwind CSS

Tailwind is configured via the `@tailwindcss/vite` plugin. Simply use utility classes in your JSX:

```jsx
export default function Button({ label }) {
  return (
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
      {label}
    </button>
  );
}
```

---

## 🔗 Related

- [Backend](../backend) – Express / Node.js API server
- [Project Root](../) – Monorepo root and documentation
