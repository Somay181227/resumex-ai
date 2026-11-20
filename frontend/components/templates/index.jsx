import { forwardRef } from "react";
import ModernTemplate from "./ModernTemplate";
import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";

const MAP = { modern: ModernTemplate, classic: ClassicTemplate, minimal: MinimalTemplate };

// A4 at 96 DPI: 794 x 1123 px
const ResumeDocument = forwardRef(function ResumeDocument({ resume }, ref) {
  const Template = MAP[resume.template] || ModernTemplate;
  return (
    <div ref={ref} className="resume-document bg-white" style={{ width: 794 }}>
      <Template resume={resume} />
    </div>
  );
});

export default ResumeDocument;
