export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#121212] m-0 p-0 text-gray-200">
        {children}
      </body>
    </html>
  )
}