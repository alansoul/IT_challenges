import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: 'Murder Mystery 2.0 | Cipher Cell CTF',
  description: 'College Cybersecurity Club CTF Tournament',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>{children}</AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}