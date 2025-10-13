import './globals.css';

export const metadata = {
  title: 'Oceanside Housing Systems',
  description: 'Internal management dashboard for housing operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
