//! Turns document text into coloured `LayoutJob`s for the editor.
//!
//! Markdown gets a hand-written highlighter tuned for writing (bigger headings,
//! coloured emphasis, list markers). Fenced code blocks inside markdown and all
//! other source files are coloured with syntect's bundled grammars.

use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::path::Path;

use egui::text::{LayoutJob, TextFormat};
use egui::{Color32, FontFamily, FontId, Stroke};
use syntect::easy::HighlightLines;
use syntect::highlighting::{FontStyle, Theme, ThemeSet};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

use crate::theme::{Palette, ThemeKind};

/// What kind of document a tab holds.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub enum Lang {
    Markdown,
    /// A syntect syntax, by name ("Rust", "Python", ...).
    Code(String),
    Plain,
}

impl Lang {
    pub fn name(&self) -> &str {
        match self {
            Lang::Markdown => "Markdown",
            Lang::Code(n) => n,
            Lang::Plain => "Plain Text",
        }
    }
    pub fn is_markdown(&self) -> bool {
        matches!(self, Lang::Markdown)
    }
}

struct CacheEntry {
    key: u64,
    job: LayoutJob,
}

pub struct Highlighter {
    pub ss: SyntaxSet,
    ts: ThemeSet,
    cache: HashMap<u64, CacheEntry>,
}

pub fn hash_of<T: Hash + ?Sized>(t: &T) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    t.hash(&mut h);
    h.finish()
}

impl Highlighter {
    pub fn new() -> Self {
        Self {
            ss: SyntaxSet::load_defaults_newlines(),
            ts: ThemeSet::load_defaults(),
            cache: HashMap::new(),
        }
    }

    pub fn lang_for_path(&self, path: &Path) -> Lang {
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if matches!(ext.as_str(), "md" | "markdown" | "mdown" | "mkd" | "mdx") {
            return Lang::Markdown;
        }
        if matches!(ext.as_str(), "txt" | "") {
            return Lang::Plain;
        }
        if let Some(s) = self.ss.find_syntax_by_extension(&ext) {
            return Lang::Code(s.name.clone());
        }
        // Some well known extras that the bundled set names differently.
        let alias = match ext.as_str() {
            "ts" | "tsx" | "mjs" | "cjs" | "jsx" => "JavaScript",
            "toml" | "ini" | "cfg" => "Python", // close enough for key = value colouring
            "kt" | "kts" => "Java",
            "sh" | "bash" | "zsh" => "Bourne Again Shell (bash)",
            _ => "",
        };
        if let Some(s) = self.ss.find_syntax_by_name(alias) {
            return Lang::Code(s.name.clone());
        }
        Lang::Plain
    }

    /// Names offered in the syntax picker.
    pub fn syntax_names(&self) -> Vec<String> {
        let mut v: Vec<String> = self
            .ss
            .syntaxes()
            .iter()
            .filter(|s| !s.hidden && s.name != "Plain Text" && s.name != "Markdown")
            .map(|s| s.name.clone())
            .collect();
        v.sort();
        v.dedup();
        v
    }

    fn theme(&self, kind: ThemeKind) -> &Theme {
        let name = match kind {
            ThemeKind::Dark => "base16-ocean.dark",
            ThemeKind::Light => "InspiredGitHub",
        };
        &self.ts.themes[name]
    }

    /// Colour `text`. Results are cached per document so typing stays fast.
    pub fn layout(
        &mut self,
        doc_id: u64,
        text: &str,
        lang: &Lang,
        font_size: f32,
        theme: ThemeKind,
    ) -> LayoutJob {
        let key = hash_of(&(text, lang, font_size.to_bits(), theme));
        if let Some(e) = self.cache.get(&doc_id) {
            if e.key == key {
                return e.job.clone();
            }
        }
        let job = match lang {
            Lang::Markdown => self.markdown_job(text, font_size, theme),
            Lang::Code(name) => self.code_job(text, name, font_size, theme),
            Lang::Plain => {
                let p = Palette::get(theme);
                let mut job = LayoutJob::default();
                job.append(text, 0.0, fmt(font_size, p.text));
                job
            }
        };
        self.cache.insert(doc_id, CacheEntry { key, job: job.clone() });
        job
    }

    pub fn forget(&mut self, doc_id: u64) {
        self.cache.remove(&doc_id);
    }

    /// Colour a code snippet (used by the preview for fenced code blocks).
    pub fn snippet_job(&self, code: &str, token: &str, font_size: f32, theme: ThemeKind) -> LayoutJob {
        let mut job = LayoutJob::default();
        let syntax = self
            .ss
            .find_syntax_by_token(token)
            .unwrap_or_else(|| self.ss.find_syntax_plain_text());
        let mut h = HighlightLines::new(syntax, self.theme(theme));
        for line in LinesWithEndings::from(code) {
            self.append_highlighted(&mut job, &mut h, line, font_size, theme);
        }
        job
    }

    fn code_job(&self, text: &str, name: &str, size: f32, theme: ThemeKind) -> LayoutJob {
        let mut job = LayoutJob::default();
        let syntax = self
            .ss
            .find_syntax_by_name(name)
            .unwrap_or_else(|| self.ss.find_syntax_plain_text());
        let mut h = HighlightLines::new(syntax, self.theme(theme));
        for line in LinesWithEndings::from(text) {
            self.append_highlighted(&mut job, &mut h, line, size, theme);
        }
        job
    }

    fn append_highlighted(
        &self,
        job: &mut LayoutJob,
        h: &mut HighlightLines,
        line: &str,
        size: f32,
        theme: ThemeKind,
    ) {
        let p = Palette::get(theme);
        match h.highlight_line(line, &self.ss) {
            Ok(ranges) => {
                for (style, piece) in ranges {
                    let c = style.foreground;
                    let mut f = fmt(size, Color32::from_rgb(c.r, c.g, c.b));
                    f.italics = style.font_style.contains(FontStyle::ITALIC);
                    if style.font_style.contains(FontStyle::UNDERLINE) {
                        f.underline = Stroke::new(1.0, f.color);
                    }
                    job.append(piece, 0.0, f);
                }
            }
            Err(_) => job.append(line, 0.0, fmt(size, p.text)),
        }
    }

    fn markdown_job(&self, text: &str, size: f32, theme: ThemeKind) -> LayoutJob {
        let p = Palette::get(theme);
        let mut job = LayoutJob::default();
        // (fence marker, highlighter for the block's language)
        let mut fence: Option<(String, Option<HighlightLines>)> = None;

        for line in LinesWithEndings::from(text) {
            let trimmed = line.trim_start();
            let fence_marker = if trimmed.starts_with("```") {
                Some("```")
            } else if trimmed.starts_with("~~~") {
                Some("~~~")
            } else {
                None
            };

            if let Some((open, hl)) = &mut fence {
                if fence_marker == Some(open.as_str()) {
                    job.append(line, 0.0, fmt(size, p.dim));
                    fence = None;
                } else if let Some(h) = hl {
                    self.append_highlighted(&mut job, h, line, size, theme);
                } else {
                    job.append(line, 0.0, fmt(size, p.code));
                }
                continue;
            }
            if let Some(m) = fence_marker {
                let lang = trimmed[3..].trim();
                let hl = if lang.is_empty() {
                    None
                } else {
                    self.ss
                        .find_syntax_by_token(lang.split_whitespace().next().unwrap_or(""))
                        .map(|s| HighlightLines::new(s, self.theme(theme)))
                };
                let marker_end = line.len() - trimmed.len() + 3;
                job.append(&line[..marker_end], 0.0, fmt(size, p.dim));
                job.append(&line[marker_end..], 0.0, fmt(size, p.accent));
                fence = Some((m.to_string(), hl));
                continue;
            }

            md_line(&mut job, line, size, &p);
        }
        job
    }
}

pub fn fmt(size: f32, color: Color32) -> TextFormat {
    TextFormat {
        font_id: FontId::new(size, FontFamily::Monospace),
        color,
        ..Default::default()
    }
}

/// Size multiplier for heading levels in the editor.
pub fn heading_scale(level: usize) -> f32 {
    match level {
        1 => 1.40,
        2 => 1.25,
        3 => 1.12,
        _ => 1.0,
    }
}

/// Count leading `#` of an ATX heading, if the line is one.
pub fn heading_level(line: &str) -> Option<usize> {
    let t = line.trim_start();
    if line.len() - t.len() > 3 {
        return None;
    }
    let n = t.chars().take_while(|c| *c == '#').count();
    if (1..=6).contains(&n) {
        let rest = &t[n..];
        if rest.is_empty() || rest.starts_with(' ') || rest.starts_with('\t') || rest.starts_with('\n') || rest.starts_with('\r') {
            return Some(n);
        }
    }
    None
}

fn is_rule(t: &str) -> bool {
    let s: String = t.chars().filter(|c| !c.is_whitespace()).collect();
    s.len() >= 3
        && (s.chars().all(|c| c == '-') || s.chars().all(|c| c == '*') || s.chars().all(|c| c == '_'))
}

/// Length in bytes of a list marker at the start of `t` (after indentation),
/// including a trailing task box like `[ ] `.
pub fn list_marker_len(t: &str) -> Option<usize> {
    let b = t.as_bytes();
    let mut n = 0;
    if !b.is_empty() && (b[0] == b'-' || b[0] == b'*' || b[0] == b'+') {
        n = 1;
    } else {
        while n < b.len() && b[n].is_ascii_digit() && n < 9 {
            n += 1;
        }
        if n == 0 || n >= b.len() || !(b[n] == b'.' || b[n] == b')') {
            return None;
        }
        n += 1;
    }
    if n < b.len() && b[n] != b' ' && b[n] != b'\t' && b[n] != b'\n' && b[n] != b'\r' {
        return None;
    }
    if n < b.len() && (b[n] == b' ' || b[n] == b'\t') {
        n += 1;
    }
    let rest = &t[n..];
    if rest.starts_with("[ ] ") || rest.starts_with("[x] ") || rest.starts_with("[X] ") {
        n += 4;
    }
    Some(n)
}

fn md_line(job: &mut LayoutJob, line: &str, size: f32, p: &Palette) {
    let indent_len = line.len() - line.trim_start().len();
    let t = &line[indent_len..];

    if let Some(level) = heading_level(line) {
        let s = size * heading_scale(level);
        let hashes = indent_len + level;
        job.append(&line[..hashes], 0.0, fmt(s, p.accent));
        let mut f = fmt(s, p.heading);
        if level <= 2 {
            f.underline = Stroke::NONE;
        }
        job.append(&line[hashes..], 0.0, f);
        return;
    }
    if is_rule(t) && !t.trim().is_empty() {
        job.append(line, 0.0, fmt(size, p.dim));
        return;
    }
    if !line[..indent_len].is_empty() {
        job.append(&line[..indent_len], 0.0, fmt(size, p.text));
    }
    if let Some(rest) = t.strip_prefix('>') {
        job.append(">", 0.0, fmt(size, p.accent));
        let mut base = fmt(size, p.quote);
        base.italics = true;
        inline(job, rest, size, p, base);
        return;
    }
    if let Some(n) = list_marker_len(t) {
        job.append(&t[..n], 0.0, fmt(size, p.marker));
        inline(job, &t[n..], size, p, fmt(size, p.text));
        return;
    }
    if t.starts_with('|') {
        // table row: colour the pipes
        let mut last = 0;
        for (i, c) in t.char_indices() {
            if c == '|' {
                if i > last {
                    inline(job, &t[last..i], size, p, fmt(size, p.text));
                }
                job.append("|", 0.0, fmt(size, p.dim));
                last = i + 1;
            }
        }
        if last < t.len() {
            inline(job, &t[last..], size, p, fmt(size, p.text));
        }
        return;
    }
    inline(job, t, size, p, fmt(size, p.text));
}

/// Colour inline markdown: `code`, **strong**, *emphasis*, ~~strike~~, [links](url).
fn inline(job: &mut LayoutJob, s: &str, size: f32, p: &Palette, base: TextFormat) {
    let mut plain_start = 0;
    let mut i = 0;
    let bytes = s.as_bytes();
    let flush = |job: &mut LayoutJob, from: usize, to: usize| {
        if to > from {
            job.append(&s[from..to], 0.0, base.clone());
        }
    };
    'outer: while i < bytes.len() {
        let c = bytes[i];
        let rest = &s[i..];
        // escapes
        if c == b'\\' && i + 1 < bytes.len() {
            i += 1 + s[i + 1..].chars().next().map(|c| c.len_utf8()).unwrap_or(1);
            continue;
        }
        if c == b'`' {
            if let Some(end) = rest[1..].find('`') {
                flush(job, plain_start, i);
                let mut f = fmt(size, p.code);
                f.background = p.code_bg;
                job.append(&rest[..end + 2], 0.0, f);
                i += end + 2;
                plain_start = i;
                continue;
            }
        }
        for (mark, kind) in [("**", 0), ("__", 0), ("~~", 2)] {
            if rest.starts_with(mark) && rest.len() > 4 {
                if let Some(end) = rest[2..].find(mark) {
                    if end > 0 && !rest[2..].starts_with(' ') {
                        flush(job, plain_start, i);
                        let mut f = base.clone();
                        if kind == 0 {
                            f.color = p.strong;
                        } else {
                            f.color = p.dim;
                            f.strikethrough = Stroke::new(1.0, p.dim);
                        }
                        job.append(&rest[..end + 4], 0.0, f);
                        i += end + 4;
                        plain_start = i;
                        continue 'outer;
                    }
                }
            }
        }
        if (c == b'*' || c == b'_') && rest.len() > 2 && !rest[1..].starts_with(' ') && !rest[1..].starts_with(c as char) {
            let prev_ok = i == 0 || !(bytes[i - 1].is_ascii_alphanumeric() && c == b'_');
            if prev_ok {
                if let Some(end) = rest[1..].find(c as char) {
                    if end > 0 && !rest[1..1 + end].ends_with(' ') && !rest[1..1 + end].contains('\n') {
                        flush(job, plain_start, i);
                        let mut f = base.clone();
                        f.italics = true;
                        f.color = p.emph;
                        job.append(&rest[..end + 2], 0.0, f);
                        i += end + 2;
                        plain_start = i;
                        continue;
                    }
                }
            }
        }
        if c == b'[' || (c == b'!' && rest.starts_with("![")) {
            let open = if c == b'!' { 1 } else { 0 };
            if let Some(close) = rest[open..].find("](") {
                let close = close + open;
                if let Some(paren) = rest[close + 2..].find(')') {
                    let label_end = close + 1;
                    let url_end = close + 2 + paren + 1;
                    if !rest[..label_end].contains('\n') {
                        flush(job, plain_start, i);
                        let mut lf = base.clone();
                        lf.color = p.link;
                        job.append(&rest[..label_end], 0.0, lf);
                        let mut uf = fmt(size, p.dim);
                        uf.underline = Stroke::new(1.0, p.faint);
                        job.append(&rest[label_end..url_end], 0.0, uf);
                        i += url_end;
                        plain_start = i;
                        continue;
                    }
                }
            }
        }
        i += s[i..].chars().next().map(|c| c.len_utf8()).unwrap_or(1);
    }
    flush(job, plain_start, s.len());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn markdown_job_covers_all_text() {
        let h = Highlighter::new();
        let text = "# Title\n\nSome **bold** and *it* and `code` [l](u)\n- [ ] task\n```rust\nfn main() {}\n```\n| a | b |\n> quote ~~x~~\n";
        let job = h.markdown_job(text, 14.0, ThemeKind::Dark);
        assert_eq!(job.text, text);
    }

    #[test]
    fn list_markers() {
        assert_eq!(list_marker_len("- a"), Some(2));
        assert_eq!(list_marker_len("12. a"), Some(4));
        assert_eq!(list_marker_len("- [ ] a"), Some(6));
        assert_eq!(list_marker_len("-a"), None);
        assert_eq!(list_marker_len("abc"), None);
    }
}
