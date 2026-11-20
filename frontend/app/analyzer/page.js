import { Suspense } from "react";
import Analyzer from "@/components/Analyzer";
import Spinner from "@/components/Spinner";

export const metadata = { title: "ATS Analyzer – ResumeX AI" };

export default function AnalyzerPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Analyzer />
    </Suspense>
  );
}
