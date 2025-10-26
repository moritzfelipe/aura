import Image from "next/image";

import "./globals.css";

export const metadata = {
  title: "Valeu Feed Mock",
  description: "Phase 1 mock curator and presentation layer for the Valeu communication protocol."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <Image
              src="/value-icon.png"
              alt="Valeu mark"
              className="app-logo"
              width={66}
              height={66}
              priority
            />
          </header>
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
