'use client';

import IssueForm from '@/components/issues/IssueForm';
import Navigation from '@/components/Navigation';

export default function NewIssuePage() {
  return (
    <div className="container mx-auto p-6">
      <Navigation />
      <IssueForm />
    </div>
  );
} 