"use client";

import { useEffect, useRef, useState } from "react";
import {
  certMeta,
  contactItems,
  dateRange,
  educationDates,
  linkItems,
  stripProtocol,
  visibleSections,
} from "@/lib/resume/layout";
import {
  SECTION_LABELS,
  type ResumeContent,
  type ResumeTemplateKey,
} from "@/types/resume";

/**
 * Live HTML preview. Mirrors the PDF/DOCX exporters (same section order and
 * visibility rules via lib/resume/layout) on an A4-proportioned white page.
 * The exported files — not this component — are what gets downloaded.
 */

const PAGE_W = 794; // A4 @ 96dpi
const PAGE_H = 1123;

interface Theme {
  font: string;
  base: number;
  name: number;
  heading: number;
  pad: number;
  accent: string;
  center: boolean;
  sectionGap: number;
  entryGap: number;
}

const THEMES: Record<ResumeTemplateKey, Theme> = {
  "ats-classic": {
    font: '"Times New Roman", Times, serif',
    base: 14, name: 27, heading: 14.5, pad: 72, accent: "#000000",
    center: true, sectionGap: 16, entryGap: 8,
  },
  "modern-developer": {
    font: 'Inter, "Segoe UI", Calibri, Arial, sans-serif',
    base: 13.3, name: 32, heading: 14.5, pad: 66, accent: "#2563eb",
    center: false, sectionGap: 17, entryGap: 9,
  },
  compact: {
    font: 'Inter, "Segoe UI", Calibri, Arial, sans-serif',
    base: 12, name: 23, heading: 12.7, pad: 48, accent: "#000000",
    center: true, sectionGap: 11, entryGap: 5,
  },
};

export default function ResumePreview({
  content,
  template,
}: {
  content: ResumeContent;
  template: ResumeTemplateKey;
}) {
  const t = THEMES[template];
  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(PAGE_H);

  useEffect(() => {
    const wrap = wrapRef.current;
    const page = pageRef.current;
    if (!wrap || !page) return;
    const update = () => {
      const s = Math.min(1, wrap.clientWidth / PAGE_W);
      setScale(s);
      setHeight(page.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  const sections = visibleSections(content);
  const contact = contactItems(content).join("  |  ");
  const links = linkItems(content).map(stripProtocol).join("  |  ");
  const pages = Math.max(1, Math.ceil((height / scale) / PAGE_H));

  const heading = (label: string) => (
    <h3
      style={{
        fontSize: t.heading,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: t.accent,
        borderBottom: `1px solid ${t.accent}`,
        paddingBottom: 2,
        marginTop: t.sectionGap,
        marginBottom: 5,
      }}
    >
      {label}
    </h3>
  );

  const bullets = (items: string[]) => (
    <ul style={{ margin: "2px 0 0 0", paddingLeft: 16, listStyle: "disc" }}>
      {items.map((b, i) => (
        <li key={i} style={{ marginBottom: 1.5 }}>{b}</li>
      ))}
    </ul>
  );

  const row = (left: React.ReactNode, right?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontWeight: 700 }}>{left}</div>
      {right ? <div style={{ whiteSpace: "nowrap" }}>{right}</div> : null}
    </div>
  );

  return (
    <div>
      <div ref={wrapRef} className="w-full overflow-hidden rounded-xl border border-[#27272a] bg-[#1a1a1a] p-0">
        <div style={{ height, position: "relative" }}>
          <div
            ref={pageRef}
            style={{
              width: PAGE_W,
              minHeight: PAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "#ffffff",
              color: "#111111",
              fontFamily: t.font,
              fontSize: t.base,
              lineHeight: 1.38,
              padding: t.pad,
              boxSizing: "border-box",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <header style={{ textAlign: t.center ? "center" : "left" }}>
              <h1 style={{ fontSize: t.name, fontWeight: 700, color: t.accent, lineHeight: 1.15 }}>
                {content.personal.fullName || "Your Name"}
              </h1>
              {contact && <p style={{ marginTop: 4 }}>{contact}</p>}
              {links && <p>{links}</p>}
            </header>

            {sections.map((key) => (
              <section key={key}>
                {heading(SECTION_LABELS[key])}

                {key === "summary" && <p>{content.summary}</p>}

                {key === "experience" &&
                  content.experience.map((e, i) => (
                    <div key={e.id} style={{ marginTop: i ? t.entryGap : 0 }}>
                      {row(
                        [e.title, e.company].filter(Boolean).join(", "),
                        dateRange(e.startDate, e.endDate, e.current),
                      )}
                      {(e.employmentType || e.location) && (
                        <div style={{ fontStyle: "italic" }}>
                          {[e.employmentType, e.location].filter(Boolean).join(" | ")}
                        </div>
                      )}
                      {bullets(e.bullets)}
                    </div>
                  ))}

                {key === "projects" &&
                  content.projects.map((p, i) => (
                    <div key={p.id} style={{ marginTop: i ? t.entryGap : 0 }}>
                      {row(p.technologies.length ? `${p.name} | ${p.technologies.join(", ")}` : p.name)}
                      {(p.url || p.githubUrl) && (
                        <div style={{ fontStyle: "italic" }}>
                          {[p.url, p.githubUrl].filter(Boolean).map(stripProtocol).join(" | ")}
                        </div>
                      )}
                      {bullets(p.bullets)}
                    </div>
                  ))}

                {key === "skills" &&
                  content.skills
                    .filter((g) => g.items.length)
                    .map((g) => (
                      <p key={g.id}>
                        <strong>{g.category || "Skills"}: </strong>
                        {g.items.join(", ")}
                      </p>
                    ))}

                {key === "education" &&
                  content.education.map((e, i) => {
                    const degree = [e.degree, e.field].filter(Boolean).join(", ");
                    const meta = [degree ? e.institution : "", e.grade ? `Grade: ${e.grade}` : ""]
                      .filter(Boolean)
                      .join(" | ");
                    return (
                      <div key={e.id} style={{ marginTop: i ? t.entryGap : 0 }}>
                        {row(degree || e.institution, educationDates(e))}
                        {meta && <div style={{ fontStyle: "italic" }}>{meta}</div>}
                      </div>
                    );
                  })}

                {key === "certifications" &&
                  bullets(content.certifications.map((c) => [c.name, certMeta(c)].filter(Boolean).join(" - ")))}

                {key === "achievements" &&
                  bullets(content.achievements.map((a) => (a.description ? `${a.title}: ${a.description}` : a.title)))}
              </section>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Approx. {pages} page{pages > 1 ? "s" : ""} · A4 · the downloaded file paginates automatically
      </p>
    </div>
  );
}
