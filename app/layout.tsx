import "./globals.css";

export const metadata = {
  title: "Aura Feed Mock",
  description: "Phase 1 mock curator and presentation layer for the Aura communication protocol."
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
              <h1>Aura Curator</h1>
              <p>Explore prototype posts and feel the tipping loop—no blockchain required.</p>
            </div>
          </header>
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
