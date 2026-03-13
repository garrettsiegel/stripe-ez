import { useState } from "react";

type CodeBlockProps = {
  label?: string;
  code: string;
  copyable?: boolean;
};

async function writeText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CodeBlock({ label, code, copyable = false }: CodeBlockProps) {
  const [copyState, setCopyState] = useState("Copy");

  const handleCopy = async () => {
    const copied = await writeText(code);
    setCopyState(copied ? "Copied" : "Select text");

    window.setTimeout(() => {
      setCopyState("Copy");
    }, 1800);
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        {label ? <span className="code-block__label">{label}</span> : <span className="sr-only">Code block</span>}
        {copyable ? (
          <button aria-live="polite" className="copy-button" onClick={handleCopy} type="button">
            {copyState}
          </button>
        ) : null}
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}