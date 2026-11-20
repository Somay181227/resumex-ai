// Uses the browser's print engine ("Save as PDF") so the PDF keeps real, selectable text that ATS parsers can read.
export function printResume(filename = "resume") {
  const previousTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
