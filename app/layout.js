export const metadata = {
  title: '우리 가계부',
  description: '부부 공동 가계부 앱',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}