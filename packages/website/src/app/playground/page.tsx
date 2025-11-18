'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Playground component with SSR disabled
const Playground = dynamic(
  () => import('@/components/Playground'),
  { ssr: false }
);

export default function PlaygroundPage() {
  return (
    <div className="playground-container">
      <Playground />
    </div>
  );
}
