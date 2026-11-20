import ResumeEditor from "@/components/builder/ResumeEditor";

export const metadata = { title: "Edit Resume – ResumeX AI" };

export default function EditResumePage({ params }) {
  return <ResumeEditor key={params.id} id={params.id} />;
}
