import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
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
  type ResumeSectionKey,
  type ResumeTemplateKey,
} from "@/types/resume";

/**
 * Server-side PDF and DOCX generation. Both produce real, selectable text
 * (no images, tables or columns) so ATS parsers can read them.
 */

// A4
const PAGE_W = 595.28;
const PAGE_H = 841.89;

interface TemplateStyle {
  fontFamily: "serif" | "sans";
  margin: number;
  nameSize: number;
  centerHeader: boolean;
  headingSize: number;
  bodySize: number;
  lineGap: number; // extra leading
  sectionGap: number;
  entryGap: number;
  accent: RGB;
  accentHex: string;
  headingRule: boolean;
  docxFont: string;
}

const TEMPLATES: Record<ResumeTemplateKey, TemplateStyle> = {
  "ats-classic": {
    fontFamily: "serif",
    margin: 54,
    nameSize: 20,
    centerHeader: true,
    headingSize: 11,
    bodySize: 10.5,
    lineGap: 2.5,
    sectionGap: 12,
    entryGap: 6,
    accent: rgb(0, 0, 0),
    accentHex: "000000",
    headingRule: true,
    docxFont: "Times New Roman",
  },
  "modern-developer": {
    fontFamily: "sans",
    margin: 50,
    nameSize: 24,
    centerHeader: false,
    headingSize: 11,
    bodySize: 10,
    lineGap: 2.5,
    sectionGap: 13,
    entryGap: 7,
    accent: rgb(0.145, 0.388, 0.922),
    accentHex: "2563EB",
    headingRule: true,
    docxFont: "Calibri",
  },
  compact: {
    fontFamily: "sans",
    margin: 36,
    nameSize: 17,
    centerHeader: true,
    headingSize: 9.5,
    bodySize: 9,
    lineGap: 1.5,
    sectionGap: 8,
    entryGap: 4,
    accent: rgb(0, 0, 0),
    accentHex: "000000",
    headingRule: true,
    docxFont: "Calibri",
  },
};

// ─── PDF ──────────────────────────────────────────────────────────────────────

const REPLACEMENTS: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "…": "...",
  " ": " ",
  "→": "->",
  "‑": "-",
  "−": "-",
};

export class UnsupportedPdfTextError extends Error {
  constructor() {
    super("Resume contains characters the PDF export cannot encode.");
    this.name = "UnsupportedPdfTextError";
  }
}

function makeSafe(font: PDFFont) {
  const cache = new Map<string, string>();
  return (input: string): string => {
    let out = "";
    for (const raw of input.replace(/\s+/g, " ")) {
      const ch = REPLACEMENTS[raw] ?? raw;
      let ok = cache.get(ch);
      if (ok === undefined) {
        try {
          font.encodeText(ch);
          ok = ch;
        } catch {
          // The built-in PDF fonts only cover WinAnsi. Never silently swap
          // characters for "?" — that would corrupt the candidate's content.
          throw new UnsupportedPdfTextError();
        }
        cache.set(ch, ok);
      }
      out += ok;
    }
    return out;
  };
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

class PdfWriter {
  private page: PDFPage;
  private y: number;
  private readonly safe: (s: string) => string;
  private readonly contentW: number;

  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
    private st: TemplateStyle,
  ) {
    this.page = doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - st.margin;
    this.safe = makeSafe(fonts.regular);
    this.contentW = PAGE_W - st.margin * 2;
  }

  private get lineH() {
    return this.st.bodySize + this.st.lineGap;
  }

  private ensure(height: number) {
    if (this.y - height < this.st.margin) {
      this.page = this.doc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - this.st.margin;
    }
  }

  private wrap(text: string, font: PDFFont, size: number, width: number) {
    const words = this.safe(text).split(" ").filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // Break very long tokens (URLs) that exceed the line width
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  gap(h: number) {
    this.y -= h;
  }

  header(content: ResumeContent) {
    const { st, fonts } = this;
    const name = this.safe(content.personal.fullName || "Your Name");
    const size = st.nameSize;
    this.ensure(size + 4);
    const nameW = fonts.bold.widthOfTextAtSize(name, size);
    const x = st.centerHeader ? st.margin + (this.contentW - nameW) / 2 : st.margin;
    this.y -= size;
    this.page.drawText(name, { x, y: this.y, size, font: fonts.bold, color: st.accent });
    this.y -= 5;

    const lines = [contactItems(content).join("  |  "), linkItems(content).map(stripProtocol).join("  |  ")]
      .filter(Boolean);
    for (const raw of lines) {
      for (const l of this.wrap(raw, fonts.regular, st.bodySize, this.contentW)) {
        this.ensure(this.lineH);
        const w = fonts.regular.widthOfTextAtSize(l, st.bodySize);
        const lx = st.centerHeader ? st.margin + (this.contentW - w) / 2 : st.margin;
        this.y -= this.lineH;
        this.page.drawText(l, { x: lx, y: this.y, size: st.bodySize, font: fonts.regular, color: rgb(0.1, 0.1, 0.1) });
      }
    }
  }

  heading(label: string) {
    const { st, fonts } = this;
    this.ensure(st.sectionGap + st.headingSize + 24);
    this.y -= st.sectionGap;
    const text = this.safe(label.toUpperCase());
    this.y -= st.headingSize;
    this.page.drawText(text, { x: st.margin, y: this.y, size: st.headingSize, font: fonts.bold, color: st.accent });
    if (st.headingRule) {
      this.y -= 3;
      this.page.drawLine({
        start: { x: st.margin, y: this.y },
        end: { x: PAGE_W - st.margin, y: this.y },
        thickness: 0.6,
        color: st.accent,
      });
    }
    this.y -= 3;
  }

  paragraph(text: string, font = this.fonts.regular) {
    for (const l of this.wrap(text, font, this.st.bodySize, this.contentW)) {
      this.ensure(this.lineH);
      this.y -= this.lineH;
      this.page.drawText(l, { x: this.st.margin, y: this.y, size: this.st.bodySize, font, color: rgb(0.1, 0.1, 0.1) });
    }
  }

  /** Left text (bold) with an optional right-aligned value on the same line. */
  entryLine(left: string, right: string, bold = true, keepWith = 0) {
    const { st, fonts } = this;
    const font = bold ? fonts.bold : fonts.italic;
    const r = this.safe(right);
    const rW = r ? fonts.regular.widthOfTextAtSize(r, st.bodySize) : 0;
    // Only the first line shares space with the right-aligned value;
    // wrap everything at that width so no text is dropped.
    const lines = this.wrap(left, font, st.bodySize, this.contentW - rW - (rW ? 12 : 0));
    if (!lines.length) lines.push("");
    this.ensure(this.lineH * lines.length + keepWith);
    lines.forEach((l, i) => {
      this.ensure(this.lineH);
      this.y -= this.lineH;
      this.page.drawText(l, { x: st.margin, y: this.y, size: st.bodySize, font, color: rgb(0.07, 0.07, 0.07) });
      if (i === 0 && r) {
        this.page.drawText(r, {
          x: PAGE_W - st.margin - rW,
          y: this.y,
          size: st.bodySize,
          font: fonts.regular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
    });
  }

  bullet(text: string) {
    const { st, fonts } = this;
    const indent = 12;
    const lines = this.wrap(text, fonts.regular, st.bodySize, this.contentW - indent);
    lines.forEach((l, i) => {
      this.ensure(this.lineH);
      this.y -= this.lineH;
      if (i === 0) {
        this.page.drawText("•", { x: st.margin + 2, y: this.y, size: st.bodySize, font: fonts.regular, color: rgb(0.1, 0.1, 0.1) });
      }
      this.page.drawText(l, { x: st.margin + indent, y: this.y, size: st.bodySize, font: fonts.regular, color: rgb(0.1, 0.1, 0.1) });
    });
  }

  labelled(label: string, value: string) {
    const { st, fonts } = this;
    const lab = this.safe(`${label}: `);
    const labW = fonts.bold.widthOfTextAtSize(lab, st.bodySize);
    const words = this.safe(value).split(" ").filter(Boolean);
    let line = "";
    let first = true;
    const flush = () => {
      this.ensure(this.lineH);
      this.y -= this.lineH;
      if (first) {
        this.page.drawText(lab, { x: st.margin, y: this.y, size: st.bodySize, font: fonts.bold, color: rgb(0.07, 0.07, 0.07) });
      }
      this.page.drawText(line, {
        x: st.margin + (first ? labW : 0),
        y: this.y,
        size: st.bodySize,
        font: fonts.regular,
        color: rgb(0.1, 0.1, 0.1),
      });
      first = false;
      line = "";
    };
    for (const w of words) {
      const cand = line ? `${line} ${w}` : w;
      const avail = this.contentW - (first ? labW : 0);
      if (fonts.regular.widthOfTextAtSize(cand, st.bodySize) <= avail) line = cand;
      else {
        if (line) flush();
        line = w;
      }
    }
    if (line || first) flush();
  }

  entryGap() {
    this.y -= this.st.entryGap;
  }
}

export async function renderResumePdf(
  content: ResumeContent,
  template: ResumeTemplateKey,
): Promise<Uint8Array> {
  const st = TEMPLATES[template] ?? TEMPLATES["ats-classic"];
  const doc = await PDFDocument.create();
  const serif = st.fontFamily === "serif";
  const fonts: Fonts = {
    regular: await doc.embedFont(serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica),
    bold: await doc.embedFont(serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold),
    italic: await doc.embedFont(serif ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique),
  };

  doc.setTitle(`${content.personal.fullName || "Resume"} - Resume`);
  doc.setAuthor(content.personal.fullName || "");

  const w = new PdfWriter(doc, fonts, st);
  w.header(content);

  for (const key of visibleSections(content)) {
    w.heading(SECTION_LABELS[key]);
    switch (key) {
      case "summary":
        w.paragraph(content.summary);
        break;
      case "experience":
        content.experience.forEach((e, i) => {
          if (i > 0) w.entryGap();
          w.entryLine(
            [e.title, e.company].filter(Boolean).join(", "),
            dateRange(e.startDate, e.endDate, e.current),
            true,
            e.bullets.length ? 14 : 0,
          );
          const meta = [e.employmentType, e.location].filter(Boolean).join(" | ");
          if (meta) w.entryLine(meta, "", false);
          e.bullets.forEach((b) => w.bullet(b));
        });
        break;
      case "projects":
        content.projects.forEach((p, i) => {
          if (i > 0) w.entryGap();
          w.entryLine(
            p.technologies.length ? `${p.name} | ${p.technologies.join(", ")}` : p.name,
            "",
            true,
            p.bullets.length ? 14 : 0,
          );
          const links = [p.url, p.githubUrl].filter(Boolean).map(stripProtocol).join(" | ");
          if (links) w.entryLine(links, "", false);
          p.bullets.forEach((b) => w.bullet(b));
        });
        break;
      case "skills":
        content.skills
          .filter((g) => g.items.length)
          .forEach((g) => w.labelled(g.category || "Skills", g.items.join(", ")));
        break;
      case "education":
        content.education.forEach((e, i) => {
          if (i > 0) w.entryGap();
          const degree = [e.degree, e.field].filter(Boolean).join(", ");
          w.entryLine(degree || e.institution, educationDates(e), true);
          const meta = [degree ? e.institution : "", e.grade ? `Grade: ${e.grade}` : ""]
            .filter(Boolean)
            .join(" | ");
          if (meta) w.entryLine(meta, "", false);
        });
        break;
      case "certifications":
        content.certifications.forEach((c) => w.bullet([c.name, certMeta(c)].filter(Boolean).join(" - ")));
        break;
      case "achievements":
        content.achievements.forEach((a) =>
          w.bullet(a.description ? `${a.title}: ${a.description}` : a.title),
        );
        break;
    }
  }

  return doc.save();
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

const TWIP_PER_PT = 20;
const A4_W_TWIP = 11906;
const A4_H_TWIP = 16838;

export async function renderResumeDocx(
  content: ResumeContent,
  template: ResumeTemplateKey,
): Promise<Buffer> {
  const st = TEMPLATES[template] ?? TEMPLATES["ats-classic"];
  const marginTwip = Math.round(st.margin * TWIP_PER_PT);
  const rightTab = A4_W_TWIP - marginTwip * 2;
  const size = Math.round(st.bodySize * 2); // half-points
  const font = st.docxFont;

  const run = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font, size: opts.size ?? size, bold: opts.bold, italics: opts.italics, color: opts.color });

  const spacing = (before = 0, after = 0) => ({ before, after, line: 252 });
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      alignment: st.centerHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: spacing(0, 60),
      children: [run(content.personal.fullName || "Your Name", { bold: true, size: Math.round(st.nameSize * 2), color: st.accentHex })],
    }),
  );
  for (const line of [contactItems(content).join("  |  "), linkItems(content).map(stripProtocol).join("  |  ")]) {
    if (!line) continue;
    children.push(
      new Paragraph({
        alignment: st.centerHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: spacing(0, 20),
        children: [run(line)],
      }),
    );
  }

  const heading = (key: ResumeSectionKey) =>
    new Paragraph({
      keepNext: true,
      spacing: spacing(Math.round(st.sectionGap * TWIP_PER_PT), 60),
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: st.accentHex, space: 1 } },
      children: [run(SECTION_LABELS[key].toUpperCase(), { bold: true, size: Math.round(st.headingSize * 2), color: st.accentHex })],
    });

  const entry = (left: string, right: string, bold = true, keepNext = false, before = 0) =>
    new Paragraph({
      keepNext,
      spacing: spacing(before, 0),
      tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
      children: [run(left, { bold, italics: !bold }), ...(right ? [run(`\t${right}`)] : [])],
    });

  const bullet = (text: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: spacing(0, 10),
      children: [run(text)],
    });

  const entryBefore = Math.round(st.entryGap * TWIP_PER_PT);

  for (const key of visibleSections(content)) {
    children.push(heading(key));
    switch (key) {
      case "summary":
        children.push(new Paragraph({ spacing: spacing(), children: [run(content.summary)] }));
        break;
      case "experience":
        content.experience.forEach((e, i) => {
          children.push(
            entry([e.title, e.company].filter(Boolean).join(", "), dateRange(e.startDate, e.endDate, e.current), true, true, i ? entryBefore : 0),
          );
          const meta = [e.employmentType, e.location].filter(Boolean).join(" | ");
          if (meta) children.push(entry(meta, "", false, true));
          e.bullets.forEach((b) => children.push(bullet(b)));
        });
        break;
      case "projects":
        content.projects.forEach((p, i) => {
          children.push(
            entry(p.technologies.length ? `${p.name} | ${p.technologies.join(", ")}` : p.name, "", true, true, i ? entryBefore : 0),
          );
          const links = [p.url, p.githubUrl].filter(Boolean).map(stripProtocol).join(" | ");
          if (links) children.push(entry(links, "", false, true));
          p.bullets.forEach((b) => children.push(bullet(b)));
        });
        break;
      case "skills":
        content.skills
          .filter((g) => g.items.length)
          .forEach((g) =>
            children.push(
              new Paragraph({
                spacing: spacing(0, 20),
                children: [run(`${g.category || "Skills"}: `, { bold: true }), run(g.items.join(", "))],
              }),
            ),
          );
        break;
      case "education":
        content.education.forEach((e, i) => {
          const degree = [e.degree, e.field].filter(Boolean).join(", ");
          children.push(entry(degree || e.institution, educationDates(e), true, true, i ? entryBefore : 0));
          const meta = [degree ? e.institution : "", e.grade ? `Grade: ${e.grade}` : ""].filter(Boolean).join(" | ");
          if (meta) children.push(entry(meta, "", false));
        });
        break;
      case "certifications":
        content.certifications.forEach((c) => children.push(bullet([c.name, certMeta(c)].filter(Boolean).join(" - "))));
        break;
      case "achievements":
        content.achievements.forEach((a) =>
          children.push(bullet(a.description ? `${a.title}: ${a.description}` : a.title)),
        );
        break;
    }
  }

  const doc = new Document({
    creator: content.personal.fullName || "JobPilot",
    title: `${content.personal.fullName || "Resume"} - Resume`,
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_W_TWIP, height: A4_H_TWIP },
            margin: { top: marginTwip, bottom: marginTwip, left: marginTwip, right: marginTwip },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
