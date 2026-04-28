"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function LatexRenderer({ latex, displayMode = true, className }: LatexRendererProps) {
  if (!latex) return null;

  let html = "";
  try {
    html = katex.renderToString(latex, { displayMode, throwOnError: false });
  } catch (e) {
    html = `<pre class=\"text-xs text-destructive\">LaTeX inválido</pre>`;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default LatexRenderer;

