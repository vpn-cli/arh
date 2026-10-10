import { notFound } from 'next/navigation';
import IconsPreviewClient from './IconsPreviewClient';

export default function IconsDiagnosePage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <IconsPreviewClient />;
}
