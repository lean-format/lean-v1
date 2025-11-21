import '../app/style.css';

export const metadata = {
    title: 'LEAN Format - Lightweight Efficient Adaptive Notation',
    description: 'A minimal, human-readable data format that combines JSON\'s flexibility with CSV\'s compactness',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body suppressHydrationWarning>
        {children}
        </body>
        </html>
    )
}