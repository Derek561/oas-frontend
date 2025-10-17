import "./globals.css";

export const metadata = {
  title: "Oceanside Housing Dashboard",
  description: "A secure portal for managing residents, maintenance, and reports at Oceanside Housing LLC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
