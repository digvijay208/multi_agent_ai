import './globals.css';

export const metadata = {
  title: 'FusionAI - Fusion of AI Models',
  description: 'Collaborative AI powered by GPT-4o, Claude Sonnet, and Gemini working together',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
