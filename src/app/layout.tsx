import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Load Inter font for non-Apple devices
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Ramanuj Saket - AI/ML/Gen-AI Engineer | Professional Portfolio",
    template: "%s | Ramanuj Saket Portfolio"
  },
  description: "Professional portfolio of Ramanuj Saket - AI/ML/Gen-AI Engineer showcasing production AI systems, agentic workflows, and machine learning solutions.",
  keywords: [
    "Ramanuj Saket",
    "AI/ML/Gen-AI Engineer",
    "Python Developer",
    "AI Engineer",
    "Portfolio",
    "Software Developer",
    "Machine Learning",
    "Generative AI",
    "Web Development",
    "Next.js",
    "React",
    "FastAPI",
    "Django",
    "Automation",
    "LangChain",
    "Smart India Hackathon",
    "Freelancer",
    "AI Chatbot",
    "Professional Portfolio",
    "Developer Portfolio",
    "Tech Portfolio",
    "Internship",
    "Python Automation",
    "Web Scraping",
    "API Development"
  ],
  authors: [
    {
      name: "Ramanuj Saket",
      url: "https://portfolio.ramanujsaket.com/",
    },
  ],
  creator: "Ramanuj Saket",
  publisher: "Ramanuj Saket",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portfolio.ramanujsaket.com/",
    title: "Ramanuj Saket - AI/ML/Gen-AI Engineer | Professional Portfolio",
    description: "Professional portfolio showcasing production AI systems, agentic workflows, computer vision, and machine learning solutions.",
    siteName: "Ramanuj Saket Portfolio",
    images: [
      {
        url: "https://portfolio.ramanujsaket.com/portfolio.png",
        width: 1200,
        height: 630,
        alt: "Ramanuj Saket - Professional Portfolio with AI Chatbot",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ramanuj Saket - AI/ML/Gen-AI Engineer",
    description: "Professional portfolio showcasing AI projects, agentic systems, computer vision, and automation solutions.",
    creator: "@LearnCodeWithRam",
    site: "@LearnCodeWithRam",
    images: [{
      url: "https://portfolio.ramanujsaket.com/portfolio.png",
      alt: "Ramanuj Saket Professional Portfolio"
    }],
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      }
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.svg?v=2",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://portfolio.ramanujsaket.com/",
  },
  category: "technology",
  classification: "Portfolio Website",
  other: {
    "google-site-verification": "your-google-verification-code-here",
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href="https://portfolio.ramanujsaket.com/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Ramanuj Saket",
              "jobTitle": "AI/ML/Gen-AI Engineer",
              "url": "https://portfolio.ramanujsaket.com/",
              "image": "https://portfolio.ramanujsaket.com/profile.png",
              "sameAs": [
                "https://github.com/LearnCodeWithRam",
                "https://linkedin.com/in/ramanuj-saket"
              ],
              "worksFor": {
                "@type": "Organization",
                "name": "Freelance"
              },
              "alumniOf": {
                "@type": "Organization",
                "name": "SATI"
              },
              "knowsAbout": [
                "Python Development",
                "AI Engineering",
                "Machine Learning",
                "Generative AI",
                "Web Development",
                "Automation",
                "Full Stack Development"
              ],
              "description": "AI/ML/Gen-AI Engineer with expertise in building production AI systems, agentic workflows, computer vision solutions, and automation tools."
            })
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <main className="flex min-h-screen flex-col">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}