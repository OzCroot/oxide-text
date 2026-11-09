//! Markdown editing operations. They work on plain strings and character
//! ranges so they are easy to test and independent of the UI.

use crate::highlight::{heading_level, list_marker_len};

/// A selection in character (not byte) indices, `start <= end`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Sel {
    pub start: usize,
    pub end: usize,
}

impl Sel {
    pub fn new(a: usize, b: usize) -> Self {
        Sel { start: a.min(b), end: a.max(b) }
    }
    pub fn caret(a: usize) -> Self {
        Sel { start: a, end: a }
    }
    pub fn is_empty(&self) -> bool {
        self.start == self.end
    }
}

pub fn c2b(s: &str, c: usize) -> usize {
    s.char_indices().nth(c).map(|(b, _)| b).unwrap_or(s.len())
}

pub fn b2c(s: &str, b: usize) -> usize {
    s[..b.min(s.len())].chars().count()
}

fn line_start(s: &str, b: usize) -> usize {
    s[..b].rfind('\n').map(|i| i + 1).unwrap_or(0)
}

fn line_end(s: &str, b: usize) -> usize {
    s[b..].find('\n').map(|i| b + i).unwrap_or(s.len())
}

/// Wrap the selection with `left`/`right` (e.g. `**`), or unwrap it if it is already wrapped.
pub fn toggle_wrap(text: &mut String, sel: Sel, left: &str, right: &str) -> Sel {
    let bs = c2b(text, sel.start);
    let be = c2b(text, sel.end);
    let (ll, rl) = (left.chars().count(), right.chars().count());
    let inner = &text[bs..be];
    if inner.len() >= left.len() + right.len() && inner.starts_with(left) && inner.ends_with(right) && !inner.is_empty() {
        let new_inner = inner[left.len()..inner.len() - right.len()].to_string();
        text.replace_range(bs..be, &new_inner);
        return Sel::new(sel.start, sel.end - ll - rl);
    }
    if text[..bs].ends_with(left) && text[be..].starts_with(right) {
        text.replace_range(be..be + right.len(), "");
        text.replace_range(bs - left.len()..bs, "");
        return Sel::new(sel.start - ll, sel.end - ll);
    }
    text.insert_str(be, right);
    text.insert_str(bs, left);
    Sel::new(sel.start + ll, sel.end + ll)
}

/// Apply `f` to every line touched by the selection.
/// For a caret, the caret keeps its place relative to the end of the line.
fn map_lines(text: &mut String, sel: Sel, f: impl Fn(usize, &str) -> String) -> Sel {
    let bs = c2b(text, sel.start);
    let mut be = c2b(text, sel.end);
    if be > bs && text[..be].ends_with('\n') {
        be -= 1;
    }
    let ls = line_start(text, bs);
    let le = line_end(text, be);
    let block = text[ls..le].to_string();
    let new_block: Vec<String> = block.split('\n').enumerate().map(|(i, l)| f(i, l)).collect();
    let new_block = new_block.join("\n");
    let ls_c = b2c(text, ls);
    let old_len = block.chars().count();
    let new_len = new_block.chars().count();
    text.replace_range(ls..le, &new_block);
    if sel.is_empty() {
        let from_end = (ls_c + old_len).saturating_sub(sel.start);
        let pos = (ls_c + new_len).saturating_sub(from_end).max(ls_c);
        Sel::caret(pos)
    } else {
        Sel::new(ls_c, ls_c + new_len)
    }
}

fn split_indent(l: &str) -> (&str, &str) {
    let n = l.len() - l.trim_start_matches([' ', '\t']).len();
    (&l[..n], &l[n..])
}

fn strip_heading(body: &str) -> &str {
    let n = body.chars().take_while(|c| *c == '#').count();
    if n > 0 && n <= 6 {
        body[n..].trim_start_matches(' ')
    } else {
        body
    }
}

/// Make the touched lines a heading of `level` (toggles off if already that level; 0 = paragraph).
pub fn set_heading(text: &mut String, sel: Sel, level: usize) -> Sel {
    map_lines(text, sel, |_, l| {
        let (ind, body) = split_indent(l);
        let cur = heading_level(l).unwrap_or(0);
        let plain = strip_heading(body);
        if level == 0 || cur == level {
            format!("{ind}{plain}")
        } else {
            format!("{ind}{} {plain}", "#".repeat(level))
        }
    })
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum LinePrefix {
    Bullet,
    Numbered,
    Task,
    Quote,
}

fn strip_list(body: &str) -> &str {
    match list_marker_len(body) {
        Some(n) => &body[n..],
        None => body,
    }
}

fn has_prefix(body: &str, kind: LinePrefix) -> bool {
    match kind {
        LinePrefix::Quote => body.starts_with('>'),
        LinePrefix::Task => {
            list_marker_len(body).map(|n| body[..n].contains('[')).unwrap_or(false)
        }
        LinePrefix::Bullet => {
            (body.starts_with("- ") || body.starts_with("* ") || body.starts_with("+ "))
                && !has_prefix(body, LinePrefix::Task)
        }
        LinePrefix::Numbered => {
            let d = body.chars().take_while(|c| c.is_ascii_digit()).count();
            d > 0 && (body[d..].starts_with(". ") || body[d..].starts_with(") "))
        }
    }
}

/// Toggle a list / quote prefix on every touched non-empty line.
pub fn toggle_prefix(text: &mut String, sel: Sel, kind: LinePrefix) -> Sel {
    let bs = c2b(text, sel.start);
    let be = c2b(text, sel.end);
    let ls = line_start(text, bs);
    let le = line_end(text, be.max(bs));
    let all_have = text[ls..le]
        .split('\n')
        .filter(|l| !l.trim().is_empty())
        .all(|l| has_prefix(split_indent(l).1, kind));
    let any_line = text[ls..le].split('\n').any(|l| !l.trim().is_empty());
    let counter = std::cell::Cell::new(0usize);
    map_lines(text, sel, |_, l| {
        let (ind, body) = split_indent(l);
        if body.trim().is_empty() && any_line {
            return l.to_string();
        }
        if all_have && any_line {
            let stripped = match kind {
                LinePrefix::Quote => body[1..].strip_prefix(' ').unwrap_or(&body[1..]),
                _ => strip_list(body),
            };
            return format!("{ind}{stripped}");
        }
        let base = match kind {
            LinePrefix::Quote => body,
            _ => strip_list(body),
        };
        let n = counter.get() + 1;
        counter.set(n);
        match kind {
            LinePrefix::Bullet => format!("{ind}- {base}"),
            LinePrefix::Numbered => format!("{ind}{n}. {base}"),
            LinePrefix::Task => format!("{ind}- [ ] {base}"),
            LinePrefix::Quote => format!("{ind}> {base}"),
        }
    })
}

/// Indent or outdent the touched lines by `unit` spaces.
pub fn indent_lines(text: &mut String, sel: Sel, unit: usize, outdent: bool) -> Sel {
    let pad = " ".repeat(unit);
    map_lines(text, sel, |_, l| {
        if outdent {
            let n = l.chars().take(unit).take_while(|c| *c == ' ').count();
            if n == 0 && l.starts_with('\t') {
                l[1..].to_string()
            } else {
                l[n..].to_string()
            }
        } else if l.is_empty() && !sel.is_empty() {
            String::new()
        } else {
            format!("{pad}{l}")
        }
    })
}

/// Replace the selection with `s`; returns a caret after it.
pub fn insert(text: &mut String, sel: Sel, s: &str) -> Sel {
    let bs = c2b(text, sel.start);
    let be = c2b(text, sel.end);
    text.replace_range(bs..be, s);
    Sel::caret(sel.start + s.chars().count())
}

/// Make sure the insertion point is on a fresh line with a blank line before it.
fn block_prefix(text: &str, at_byte: usize) -> &'static str {
    let before = &text[..at_byte];
    if before.is_empty() || before.ends_with("\n\n") {
        ""
    } else if before.ends_with('\n') {
        "\n"
    } else {
        "\n\n"
    }
}

/// Wrap the selection in a fenced code block (or insert an empty one).
pub fn code_block(text: &mut String, sel: Sel) -> Sel {
    let bs = c2b(text, sel.start);
    let be = c2b(text, sel.end);
    let body = text[bs..be].to_string();
    let pre = block_prefix(text, bs);
    let inner = if body.is_empty() { String::new() } else { format!("{}\n", body.trim_end_matches('\n')) };
    let block = format!("{pre}```\n{inner}```\n");
    text.replace_range(bs..be, &block);
    // caret right after the opening fence so a language can be typed
    Sel::caret(sel.start + pre.chars().count() + 3)
}

pub fn table(text: &mut String, sel: Sel) -> Sel {
    let bs = c2b(text, sel.start);
    let pre = block_prefix(text, bs);
    let t = "| Column | Column | Column |\n| :----- | :----: | -----: |\n| Cell   | Cell   | Cell   |\n| Cell   | Cell   | Cell   |\n";
    let s = format!("{pre}{t}");
    let start = sel.start + pre.chars().count() + 2;
    insert(text, sel, &s);
    Sel::new(start, start + 6)
}

pub fn rule(text: &mut String, sel: Sel) -> Sel {
    let bs = c2b(text, sel.start);
    let pre = block_prefix(text, bs);
    insert(text, sel, &format!("{pre}---\n\n"))
}

/// `[text](url)` around the selection, selecting the part to type next.
pub fn link(text: &mut String, sel: Sel, image: bool) -> Sel {
    let bs = c2b(text, sel.start);
    let be = c2b(text, sel.end);
    let label = text[bs..be].to_string();
    let bang = if image { "!" } else { "" };
    let url = if image { "image.png" } else { "https://" };
    if label.is_empty() {
        let placeholder = if image { "alt text" } else { "link text" };
        let s = format!("{bang}[{placeholder}]({url})");
        insert(text, sel, &s);
        let st = sel.start + bang.len() + 1;
        Sel::new(st, st + placeholder.chars().count())
    } else {
        let s = format!("{bang}[{label}]({url})");
        insert(text, sel, &s);
        let st = sel.start + bang.len() + label.chars().count() + 3;
        Sel::new(st, st + url.len())
    }
}

/// Continue lists and quotes when Enter is pressed. Returns the new caret if handled.
pub fn on_enter(text: &mut String, caret: usize) -> Option<usize> {
    let b = c2b(text, caret);
    let ls = line_start(text, b);
    let line = text[ls..b].to_string();
    let (ind, body) = split_indent(&line);
    let ind = ind.to_string();
    let (marker_len, next) = if let Some(n) = list_marker_len(body) {
        let marker = &body[..n];
        let next = if marker.starts_with(['-', '*', '+']) {
            let bullet = &marker[..1];
            if marker.contains('[') {
                format!("{bullet} [ ] ")
            } else {
                format!("{bullet} ")
            }
        } else {
            let d: String = marker.chars().take_while(|c| c.is_ascii_digit()).collect();
            let num: usize = d.parse().unwrap_or(0) + 1;
            let sep = marker.chars().nth(d.len()).unwrap_or('.');
            format!("{num}{sep} ")
        };
        (n, next)
    } else if body.starts_with("> ") || body == ">" {
        (body.len().min(2), "> ".to_string())
    } else {
        return None;
    };
    if body[marker_len..].trim().is_empty() {
        // empty item: end the list
        text.replace_range(ls..b, "");
        return Some(b2c(text, ls));
    }
    let ins = format!("\n{ind}{next}");
    text.insert_str(b, &ins);
    Some(caret + ins.chars().count())
}

fn is_table_line(l: &str) -> bool {
    l.trim_start().starts_with('|')
}

fn split_cells(l: &str) -> Vec<String> {
    let t = l.trim();
    let t = t.strip_prefix('|').unwrap_or(t);
    let t = if t.ends_with('|') && !t.ends_with("\\|") { &t[..t.len() - 1] } else { t };
    let mut cells = vec![];
    let mut cur = String::new();
    let mut prev = ' ';
    for c in t.chars() {
        if c == '|' && prev != '\\' {
            cells.push(cur.trim().to_string());
            cur.clear();
        } else {
            cur.push(c);
        }
        prev = c;
    }
    cells.push(cur.trim().to_string());
    cells
}

fn is_sep_cell(c: &str) -> bool {
    let t = c.trim();
    !t.is_empty() && t.trim_matches(':').chars().all(|c| c == '-') && t.contains('-')
}

/// Align the columns of a markdown table.
pub fn align_table(lines: &[&str]) -> Vec<String> {
    let rows: Vec<Vec<String>> = lines.iter().map(|l| split_cells(l)).collect();
    let cols = rows.iter().map(|r| r.len()).max().unwrap_or(0);
    let sep_idx = rows.iter().position(|r| r.iter().all(|c| is_sep_cell(c)));
    let mut align = vec![(false, false); cols];
    if let Some(si) = sep_idx {
        for (i, c) in rows[si].iter().enumerate() {
            let t = c.trim();
            align[i] = (t.starts_with(':'), t.ends_with(':'));
        }
    }
    let mut width = vec![3usize; cols];
    for (ri, r) in rows.iter().enumerate() {
        if Some(ri) == sep_idx {
            continue;
        }
        for (i, c) in r.iter().enumerate() {
            width[i] = width[i].max(c.chars().count());
        }
    }
    rows.iter()
        .enumerate()
        .map(|(ri, r)| {
            let mut out = String::from("|");
            for i in 0..cols {
                let w = width[i];
                let cell = r.get(i).cloned().unwrap_or_default();
                if Some(ri) == sep_idx {
                    let (l, rr) = align[i];
                    let dashes = w - l as usize - rr as usize;
                    out.push(' ');
                    if l {
                        out.push(':');
                    }
                    out.push_str(&"-".repeat(dashes));
                    if rr {
                        out.push(':');
                    }
                    out.push_str(" |");
                } else {
                    let n = cell.chars().count();
                    let pad = w - n;
                    let (pl, pr) = match align[i] {
                        (true, true) => (pad / 2, pad - pad / 2),
                        (false, true) => (pad, 0),
                        _ => (0, pad),
                    };
                    out.push(' ');
                    out.push_str(&" ".repeat(pl));
                    out.push_str(&cell);
                    out.push_str(&" ".repeat(pr));
                    out.push_str(" |");
                }
            }
            out
        })
        .collect()
}

/// Align the table under the caret. Returns false if there is none.
pub fn format_table_at(text: &mut String, caret: usize) -> bool {
    let b = c2b(text, caret);
    let lines: Vec<&str> = text.split('\n').collect();
    let line_idx = text[..b].matches('\n').count();
    if !lines.get(line_idx).map(|l| is_table_line(l)).unwrap_or(false) {
        return false;
    }
    let mut a = line_idx;
    while a > 0 && is_table_line(lines[a - 1]) {
        a -= 1;
    }
    let mut z = line_idx;
    while z + 1 < lines.len() && is_table_line(lines[z + 1]) {
        z += 1;
    }
    let aligned = align_table(&lines[a..=z]);
    let mut out: Vec<String> = lines[..a].iter().map(|s| s.to_string()).collect();
    out.extend(aligned);
    out.extend(lines[z + 1..].iter().map(|s| s.to_string()));
    *text = out.join("\n");
    true
}

/// Tidy the whole document: trailing spaces, blank lines, bullets, tables,
/// spacing around headings. Code blocks are left untouched.
pub fn clean_document(text: &str) -> String {
    let lines: Vec<&str> = text.lines().collect();
    let mut out: Vec<String> = vec![];
    let mut in_fence = false;
    let mut i = 0;
    while i < lines.len() {
        let raw = lines[i];
        let t = raw.trim_start();
        if t.starts_with("```") || t.starts_with("~~~") {
            in_fence = !in_fence;
            out.push(raw.trim_end().to_string());
            i += 1;
            continue;
        }
        if in_fence {
            out.push(raw.to_string());
            i += 1;
            continue;
        }
        if is_table_line(raw) {
            let mut z = i;
            while z + 1 < lines.len() && is_table_line(lines[z + 1]) {
                z += 1;
            }
            out.extend(align_table(&lines[i..=z]));
            i = z + 1;
            continue;
        }
        // keep markdown hard breaks (exactly two trailing spaces)
        let trimmed = raw.trim_end();
        let mut line = if raw.ends_with("  ") && !raw.ends_with("   ") && !trimmed.is_empty() {
            format!("{trimmed}  ")
        } else {
            trimmed.to_string()
        };
        let (ind, body) = split_indent(&line);
        if (body.starts_with("* ") || body.starts_with("+ ")) && !crate::highlight::heading_level(body).is_some() {
            let (ind, rest) = (ind.to_string(), body[2..].to_string());
            line = format!("{ind}- {rest}");
        }
        let is_heading = heading_level(&line).is_some();
        if line.is_empty() {
            if out.last().map(|l: &String| l.is_empty()).unwrap_or(true) {
                i += 1;
                continue; // collapse blank runs and leading blanks
            }
        } else if is_heading && out.last().map(|l| !l.is_empty()).unwrap_or(false) {
            out.push(String::new());
        } else if !is_heading && i > 0 {
            if let Some(prev) = out.last() {
                if heading_level(prev).is_some() && !prev.is_empty() {
                    out.push(String::new());
                }
            }
        }
        out.push(line);
        i += 1;
    }
    while out.last().map(|l| l.is_empty()).unwrap_or(false) {
        out.pop();
    }
    let mut s = out.join("\n");
    s.push('\n');
    s
}

/// A heading in the outline.
#[derive(Clone, Debug)]
pub struct OutlineItem {
    pub level: usize,
    pub title: String,
    pub line: usize,
    pub char_pos: usize,
}

pub fn outline(text: &str) -> Vec<OutlineItem> {
    let mut v = vec![];
    let mut in_fence = false;
    let mut chars = 0;
    for (i, l) in text.split('\n').enumerate() {
        let t = l.trim_start();
        if t.starts_with("```") || t.starts_with("~~~") {
            in_fence = !in_fence;
        } else if !in_fence {
            if let Some(level) = heading_level(l) {
                let title = strip_heading(t).trim().trim_end_matches('#').trim().to_string();
                if !title.is_empty() {
                    v.push(OutlineItem { level, title, line: i, char_pos: chars });
                }
            }
        }
        chars += l.chars().count() + 1;
    }
    v
}

/// Word / character counts for the status bar.
pub fn word_count(text: &str) -> usize {
    text.split_whitespace()
        .filter(|w| w.chars().any(|c| c.is_alphanumeric()))
        .count()
}

/// (line, column), both 1-based, for a character index.
pub fn line_col(text: &str, caret: usize) -> (usize, usize) {
    let mut line = 1;
    let mut col = 1;
    for c in text.chars().take(caret) {
        if c == '\n' {
            line += 1;
            col = 1;
        } else {
            col += 1;
        }
    }
    (line, col)
}

/// Character index where 0-based `line` starts.
pub fn line_to_char(text: &str, line: usize) -> usize {
    if line == 0 {
        return 0;
    }
    let mut n = 0;
    let mut chars = 0;
    for c in text.chars() {
        chars += 1;
        if c == '\n' {
            n += 1;
            if n == line {
                return chars;
            }
        }
    }
    chars
}

/// All matches of `query` as character ranges.
pub fn find_all(text: &str, query: &str, case_sensitive: bool, whole_word: bool) -> Vec<Sel> {
    if query.is_empty() {
        return vec![];
    }
    let (hay, needle) = if case_sensitive {
        (text.to_string(), query.to_string())
    } else {
        (text.to_lowercase(), query.to_lowercase())
    };
    // lowercase can change byte lengths for some scripts; fall back to exact search then
    let (hay, needle) = if hay.len() == text.len() { (hay, needle) } else { (text.to_string(), query.to_string()) };
    let mut out = vec![];
    let mut from = 0;
    let mut last_b = 0;
    let mut last_c = 0;
    while let Some(i) = hay[from..].find(&needle) {
        let b = from + i;
        let e = b + needle.len();
        let word_ok = !whole_word
            || (!text[..b].chars().next_back().map(is_word).unwrap_or(false)
                && !text[e..].chars().next().map(is_word).unwrap_or(false));
        if word_ok {
            let sc = last_c + text[last_b..b].chars().count();
            let ec = sc + text[b..e].chars().count();
            out.push(Sel::new(sc, ec));
            last_b = b;
            last_c = sc;
        }
        from = e.max(b + 1);
        while !hay.is_char_boundary(from) {
            from += 1;
        }
        if out.len() > 10_000 {
            break;
        }
    }
    out
}

fn is_word(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wrap_and_unwrap() {
        let mut t = "hello world".to_string();
        let s = toggle_wrap(&mut t, Sel::new(0, 5), "**", "**");
        assert_eq!(t, "**hello** world");
        assert_eq!(s, Sel::new(2, 7));
        let s = toggle_wrap(&mut t, s, "**", "**");
        assert_eq!(t, "hello world");
        assert_eq!(s, Sel::new(0, 5));
    }

    #[test]
    fn headings_toggle() {
        let mut t = "Title\nbody".to_string();
        set_heading(&mut t, Sel::caret(2), 2);
        assert_eq!(t, "## Title\nbody");
        set_heading(&mut t, Sel::caret(4), 1);
        assert_eq!(t, "# Title\nbody");
        set_heading(&mut t, Sel::caret(4), 1);
        assert_eq!(t, "Title\nbody");
    }

    #[test]
    fn lists_toggle() {
        let mut t = "a\nb\nc".to_string();
        toggle_prefix(&mut t, Sel::new(0, 5), LinePrefix::Numbered);
        assert_eq!(t, "1. a\n2. b\n3. c");
        let len = t.chars().count();
        toggle_prefix(&mut t, Sel::new(0, len), LinePrefix::Numbered);
        assert_eq!(t, "a\nb\nc");
        toggle_prefix(&mut t, Sel::new(0, 5), LinePrefix::Task);
        assert_eq!(t, "- [ ] a\n- [ ] b\n- [ ] c");
    }

    #[test]
    fn enter_continues_lists() {
        let mut t = "- one".to_string();
        let c = on_enter(&mut t, 5).unwrap();
        assert_eq!(t, "- one\n- ");
        let c2 = on_enter(&mut t, c).unwrap();
        assert_eq!(t, "- one\n");
        assert_eq!(c2, 6);
        let mut n = "3. x".to_string();
        on_enter(&mut n, 4);
        assert_eq!(n, "3. x\n4. ");
    }

    #[test]
    fn table_alignment() {
        let out = align_table(&["|a|bb|", "|:-|-:|", "|ccc|d|"]);
        assert_eq!(out, vec!["| a   |  bb |", "| :-- | --: |", "| ccc |   d |"]);
    }

    #[test]
    fn clean_doc() {
        let s = clean_document("# T\ntext   \n\n\n\n* item\n```\n*  keep   \n```\n");
        assert_eq!(s, "# T\n\ntext\n\n- item\n```\n*  keep   \n```\n");
    }

    #[test]
    fn finds() {
        let f = find_all("Foo foo food", "foo", false, true);
        assert_eq!(f, vec![Sel::new(0, 3), Sel::new(4, 7)]);
        let f = find_all("é foo", "foo", true, false);
        assert_eq!(f, vec![Sel::new(2, 5)]);
    }
}
