import './globals.css';

export const metadata = {
  title: 'FusionAI - Fusion of AI Models',
  description: 'Collaborative AI powered by GPT-4o, Claude Sonnet, and Gemini working together',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            } catch (_) {}
          `
        }} />
      </head>
      <body className="bg-[#f2f6fb] dark:bg-[#0e0e0f] font-sans text-[#060d22] dark:text-white antialiased overflow-hidden transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
