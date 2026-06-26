import type { Metadata } from "next";
import { Crimson_Text, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ParticlesBackground from "@/components/ParticlesBackground";
import { ClerkProvider } from "@clerk/nextjs";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookHub - Discover, Track, and Review Books",
  description: "A premium full-stack platform for cataloging your library, writing interactive reviews with vibe analysis, and tracking reading progress.",
  keywords: ["books", "reviews", "reading list", "literary insights", "valmiki", "mahabharata"],
  authors: [{ name: "BookHub Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${crimsonText.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            layout: {
              unsafe_disableDevelopmentModeWarnings: true,
            },
          } as any}
          localization={{
            signIn: {
              start: {
                title: "welcome to sign in",
              },
            },
            signUp: {
              start: {
                title: "welcome to sign up",
              },
            },
          }}
        >
          <Providers>
            <ParticlesBackground />
            <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}

