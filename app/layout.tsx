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
            <div className="app-title">
              <h1>Valeu Curator</h1>
              <p>Explore prototype posts from Valeu and feel the value loop—no blockchain required.</p>
            </div>
          </header>
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
