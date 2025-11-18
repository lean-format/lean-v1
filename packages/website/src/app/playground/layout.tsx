import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LEAN Playground',
  description: 'Try LEAN format interactively in your browser',
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
