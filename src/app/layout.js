import './globals.css';

export const metadata = {
  title: 'OAS Frontend',
  description: 'Oceanside Housing Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
