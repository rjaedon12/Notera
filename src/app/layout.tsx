import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

const heading = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Koda - Learn Smarter",
  description: "Create flashcards, study with multiple modes, and track your progress",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var T={
    'midnight-indigo':{'--bg-base':'#0F1117','--bg-surface':'#1a1d2e','--bg-elevated':'#23263a','--accent':'#6366f1','--accent-light':'#818cf8','--accent-muted':'#c7d2fe','--text-primary':'#e0e7ff','--text-muted':'#818cf8','--border':'#2d3155'},
    'forest-study':{'--bg-base':'#0d1f16','--bg-surface':'#14291e','--bg-elevated':'#1a3326','--accent':'#16a34a','--accent-light':'#4ade80','--accent-muted':'#bbf7d0','--text-primary':'#dcfce7','--text-muted':'#4ade80','--border':'#1f4a2e'},
    'warm-parchment':{'--bg-base':'#faf7f2','--bg-surface':'#f3ede3','--bg-elevated':'#ece5d5','--accent':'#d97706','--accent-light':'#f59e0b','--accent-muted':'#fde68a','--text-primary':'#451a03','--text-muted':'#92400e','--border':'#e0d5c0'},
    'aurora':{'--bg-base':'#0a0f1e','--bg-surface':'#111827','--bg-elevated':'#1a2338','--accent':'#06b6d4','--accent-light':'#8b5cf6','--accent-muted':'#34d399','--text-primary':'#e0f2fe','--text-muted':'#7dd3fc','--border':'#1e3a5f'},
    'chalk-slate':{'--bg-base':'#1c1917','--bg-surface':'#292524','--bg-elevated':'#3a3835','--accent':'#ef4444','--accent-light':'#f87171','--accent-muted':'#fecaca','--text-primary':'#fafaf9','--text-muted':'#a8a29e','--border':'#44403c'}
  };
  try{
    var id=localStorage.getItem('koda-color-theme');
    if(!id||!T[id])id='midnight-indigo';
    var s=document.documentElement.style,v=T[id];
    for(var k in v)s.setProperty(k,v[k]);
  }catch(e){}
})();`,
          }}
        />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)"/>
        <meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)"/>
      </head>
      <body className={`${heading.variable} ${body.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
