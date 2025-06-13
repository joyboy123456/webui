import localFont from "next/font/local";
import "./globals.css";

export const metadata = {
  title: "fal.ai Image Generator",
  description: "Generate AI Images with a beautiful interface",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
