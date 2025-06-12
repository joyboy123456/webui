import localFont from "next/font/local";
import "./globals.css";
import { cookies } from 'next/headers';

export const metadata = {
  title: "fal.ai Image Generator",
  description: "Generate AI Images with a beautiful interface",
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const isAuthed = cookieStore.get('auth')?.value === 'true';
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {isAuthed ? children : (<div className="min-h-screen flex items-center justify-center"><a href="/login" className="text-blue-600 underline">Please login first</a></div>)}
      </body>
    </html>
  );
}
