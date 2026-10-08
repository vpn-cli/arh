import { notFound } from 'next/navigation';
import DiagnoseClient from './DiagnoseClient';

export default function DiagnosePage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <DiagnoseClient />;
}
