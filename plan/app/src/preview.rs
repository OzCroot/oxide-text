//! Rendered markdown preview: pulldown-cmark events -> a small block tree -> egui widgets.

use egui::text::{LayoutJob, TextFormat};
use egui::{Align, Color32, CornerRadius, FontFamily, FontId, Frame, Margin, RichText, Sense, Stroke, Ui};
use pulldown_cmark::{Alignment, CodeBlockKind, Event, Options, Parser, Tag, TagEnd};

use crate::highlight::Highlighter;
use crate::theme::{Palette, ThemeKind};

#[derive(Clone, Default, Debug)]
pub struct SpanStyle {
    pub strong: bool,
    pub emph: bool,
    pub strike: bool,
    pub code: bool,
    pub link: Option<String>,
    pub image: bool,
}

#[derive(Clone, Debug)]
pub struct Span {
    pub text: String,
    pub style: SpanStyle,
}

pub type Inline = Vec<Span>;

#[derive(Clone, Debug)]
pub struct Item {
    /// Some((checked, byte offset of the `[ ]` in the source)) for task items.
    pub task: Option<(bool, usize)>,
    pub blocks: Vec<Block>,
}

#[derive(Clone, Debug)]
pub enum Block {
    Heading(u8, Inline),
    Para(Inline),
    Quote(Vec<Block>),
    Code(String, String),
    List(Option<u64>, Vec<Item>),
    Rule,
    Table(Vec<Alignment>, Vec<Inline>, Vec<Vec<Inline>>),
    Html(String),
}

enum Container {
    Root(Vec<Block>),
    Quote(Vec<Block>),
    List(Option<u64>, Vec<Item>),
    Item(Option<(bool, usize)>, Vec<Block>),
}

struct Builder {
    stack: Vec<Container>,
    inline: Inline,
    in_text_block: bool,
    strong: u32,
    emph: u32,
    strike: u32,
    link: Vec<String>,
    image: u32,
    code: Option<(String, String)>,
    table: Option<(Vec<Alignment>, Vec<Inline>, Vec<Vec<Inline>>)>,
    row: Vec<Inline>,
    html: Option<String>,
}

impl Builder {
    fn push_block(&mut self, b: Block) {
        self.flush_tight();
        match self.stack.last_mut() {
            Some(Container::Root(v)) | Some(Container::Quote(v)) | Some(Container::Item(_, v)) => v.push(b),
            Some(Container::List(_, items)) => items.push(Item { task: None, blocks: vec![b] }),
            None => {}
        }
    }
    /// Text that arrived outside a paragraph (tight list items) becomes a paragraph.
    fn flush_tight(&mut self) {
        if !self.in_text_block && !self.inline.is_empty() {
            let inl = std::mem::take(&mut self.inline);
            match self.stack.last_mut() {
                Some(Container::Root(v)) | Some(Container::Quote(v)) | Some(Container::Item(_, v)) => v.push(Block::Para(inl)),
                _ => {}
            }
        }
    }
    fn text(&mut self, t: &str, code: bool) {
        let style = SpanStyle {
            strong: self.strong > 0,
            emph: self.emph > 0,
            strike: self.strike > 0,
            code,
            link: self.link.last().cloned(),
            image: self.image > 0,
        };
        self.inline.push(Span { text: t.to_string(), style });
    }
}

pub fn parse(src: &str) -> Vec<Block> {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_FOOTNOTES);
    let mut b = Builder {
        stack: vec![Container::Root(vec![])],
        inline: vec![],
        in_text_block: false,
        strong: 0,
        emph: 0,
        strike: 0,
        link: vec![],
        image: 0,
        code: None,
        table: None,
        row: vec![],
        html: None,
    };
    for (ev, range) in Parser::new_ext(src, opts).into_offset_iter() {
        match ev {
            Event::Start(tag) => match tag {
                Tag::Paragraph => {
                    b.flush_tight();
                    b.in_text_block = true;
                }
                Tag::Heading { .. } => {
                    b.flush_tight();
                    b.in_text_block = true;
                }
                Tag::BlockQuote(_) => {
                    b.flush_tight();
                    b.stack.push(Container::Quote(vec![]));
                }
                Tag::CodeBlock(kind) => {
                    b.flush_tight();
                    let lang = match kind {
                        CodeBlockKind::Fenced(l) => l.split_whitespace().next().unwrap_or("").to_string(),
                        CodeBlockKind::Indented => String::new(),
                    };
                    b.code = Some((lang, String::new()));
                }
                Tag::HtmlBlock => {
                    b.flush_tight();
                    b.html = Some(String::new());
                }
                Tag::List(start) => {
                    b.flush_tight();
                    b.stack.push(Container::List(start, vec![]));
                }
                Tag::Item => b.stack.push(Container::Item(None, vec![])),
                Tag::Table(al) => {
                    b.flush_tight();
                    b.table = Some((al, vec![], vec![]));
                }
                Tag::TableHead | Tag::TableRow => b.row.clear(),
                Tag::TableCell => {
                    b.inline.clear();
                    b.in_text_block = true;
                }
                Tag::Emphasis => b.emph += 1,
                Tag::Strong => b.strong += 1,
                Tag::Strikethrough => b.strike += 1,
                Tag::Link { dest_url, .. } => b.link.push(dest_url.to_string()),
                Tag::Image { .. } => b.image += 1,
                _ => {}
            },
            Event::End(tag) => match tag {
                TagEnd::Paragraph => {
                    b.in_text_block = false;
                    let inl = std::mem::take(&mut b.inline);
                    b.push_block(Block::Para(inl));
                }
                TagEnd::Heading(level) => {
                    b.in_text_block = false;
                    let inl = std::mem::take(&mut b.inline);
                    b.push_block(Block::Heading(level as u8, inl));
                }
                TagEnd::BlockQuote(_) => {
                    b.flush_tight();
                    if let Some(Container::Quote(v)) = b.stack.pop() {
                        b.push_block(Block::Quote(v));
                    }
                }
                TagEnd::CodeBlock => {
                    if let Some((lang, code)) = b.code.take() {
                        b.push_block(Block::Code(lang, code));
                    }
                }
                TagEnd::HtmlBlock => {
                    if let Some(h) = b.html.take() {
                        b.push_block(Block::Html(h));
                    }
                }
                TagEnd::List(_) => {
                    if let Some(Container::List(s, items)) = b.stack.pop() {
                        b.push_block(Block::List(s, items));
                    }
                }
                TagEnd::Item => {
                    b.flush_tight();
                    if let Some(Container::Item(task, blocks)) = b.stack.pop() {
                        if let Some(Container::List(_, items)) = b.stack.last_mut() {
                            items.push(Item { task, blocks });
                        }
                    }
                }
                TagEnd::TableCell => {
                    b.in_text_block = false;
                    let inl = std::mem::take(&mut b.inline);
                    b.row.push(inl);
                }
                TagEnd::TableHead => {
                    if let Some(t) = &mut b.table {
                        t.1 = std::mem::take(&mut b.row);
                    }
                }
                TagEnd::TableRow => {
                    if let Some(t) = &mut b.table {
                        t.2.push(std::mem::take(&mut b.row));
                    }
                }
                TagEnd::Table => {
                    if let Some((a, h, r)) = b.table.take() {
                        b.push_block(Block::Table(a, h, r));
                    }
                }
                TagEnd::Emphasis => b.emph = b.emph.saturating_sub(1),
                TagEnd::Strong => b.strong = b.strong.saturating_sub(1),
                TagEnd::Strikethrough => b.strike = b.strike.saturating_sub(1),
                TagEnd::Link => {
                    b.link.pop();
                }
                TagEnd::Image => b.image = b.image.saturating_sub(1),
                _ => {}
            },
            Event::Text(t) => {
                if let Some((_, code)) = &mut b.code {
                    code.push_str(&t);
                } else if let Some(h) = &mut b.html {
                    h.push_str(&t);
                } else {
                    b.text(&t, false);
                }
            }
            Event::Code(t) => b.text(&t, true),
            Event::Html(t) => {
                if let Some(h) = &mut b.html {
                    h.push_str(&t);
                }
            }
            Event::InlineHtml(t) => b.text(&t, true),
            Event::SoftBreak => b.text(" ", false),
            Event::HardBreak => b.text("\n", false),
            Event::Rule => b.push_block(Block::Rule),
            Event::TaskListMarker(checked) => {
                if let Some(Container::Item(task, _)) = b.stack.last_mut() {
                    *task = Some((checked, range.start));
                }
            }
            Event::FootnoteReference(r) => b.text(&format!("[{r}]"), false),
            _ => {}
        }
    }
    b.flush_tight();
    match b.stack.into_iter().next() {
        Some(Container::Root(v)) => v,
        _ => vec![],
    }
}

/// Paints the block tree. Returns the source byte offset of a task box the user clicked.
pub struct Renderer<'a> {
    pub hl: &'a Highlighter,
    pub theme: ThemeKind,
    pub size: f32,
    pub clicked_task: Option<usize>,
}

impl<'a> Renderer<'a> {
    fn pal(&self) -> Palette {
        Palette::get(self.theme)
    }

    fn inline_job(&self, inl: &Inline, size: f32, color: Color32, family: FontFamily, wrap: f32) -> LayoutJob {
        let p = self.pal();
        let mut job = LayoutJob::default();
        job.wrap.max_width = wrap;
        for s in inl {
            let st = &s.style;
            let mut f = TextFormat {
                font_id: FontId::new(size, family.clone()),
                color,
                ..Default::default()
            };
            if st.code {
                f.font_id = FontId::new(size * 0.9, FontFamily::Monospace);
                f.color = p.code;
                f.background = p.code_bg;
            }
            if st.strong {
                f.color = if self.theme == ThemeKind::Dark { Color32::WHITE } else { Color32::BLACK };
            }
            if st.emph {
                f.italics = true;
            }
            if st.strike {
                f.strikethrough = Stroke::new(1.0, p.dim);
                f.color = p.dim;
            }
            if st.link.is_some() {
                f.color = p.link;
                f.underline = Stroke::new(1.0, p.link.gamma_multiply(0.5));
            }
            if st.image {
                f.color = p.dim;
                f.italics = true;
            }
            job.append(&s.text, 0.0, f);
        }
        job
    }

    fn inline(&self, ui: &mut Ui, inl: &Inline, size: f32, color: Color32) {
        let job = self.inline_job(inl, size, color, FontFamily::Proportional, ui.available_width());
        let links: Vec<String> = inl.iter().filter_map(|s| s.style.link.clone()).collect();
        let resp = ui.add(egui::Label::new(job).wrap());
        if let Some(first) = links.first() {
            let resp = resp.on_hover_text(first.clone());
            if resp.clicked() && (first.starts_with("http://") || first.starts_with("https://")) {
                ui.ctx().open_url(egui::OpenUrl::new_tab(first));
            }
        }
    }

    pub fn blocks(&mut self, ui: &mut Ui, blocks: &[Block]) {
        for (i, b) in blocks.iter().enumerate() {
            if i > 0 {
                ui.add_space(self.size * 0.55);
            }
            self.block(ui, b);
        }
    }

    fn block(&mut self, ui: &mut Ui, b: &Block) {
        let p = self.pal();
        let size = self.size;
        match b {
            Block::Heading(level, inl) => {
                let scale = match level {
                    1 => 2.0,
                    2 => 1.6,
                    3 => 1.3,
                    4 => 1.12,
                    _ => 1.0,
                };
                ui.add_space(size * 0.35);
                let color = if *level <= 2 { p.text } else { p.heading };
                let mut inl = inl.clone();
                for s in &mut inl {
                    s.style.strong = s.style.strong || *level >= 5;
                }
                self.inline(ui, &inl, size * scale, color);
                if *level <= 2 {
                    let r = ui.available_rect_before_wrap();
                    ui.painter().hline(r.x_range(), r.top() + 1.0, Stroke::new(1.0, p.faint));
                    ui.add_space(4.0);
                }
            }
            Block::Para(inl) => self.inline(ui, inl, size, p.text),
            Block::Quote(inner) => {
                let resp = Frame::new()
                    .inner_margin(Margin { left: 14, right: 4, top: 2, bottom: 2 })
                    .show(ui, |ui| {
                        ui.style_mut().visuals.override_text_color = Some(p.quote);
                        let mut sub = Renderer { hl: self.hl, theme: self.theme, size: self.size, clicked_task: None };
                        sub.blocks(ui, inner);
                        if sub.clicked_task.is_some() {
                            self.clicked_task = sub.clicked_task;
                        }
                    });
                let r = resp.response.rect;
                ui.painter().vline(r.left() + 3.0, r.y_range(), Stroke::new(3.0, p.accent.gamma_multiply(0.7)));
            }
            Block::Code(lang, code) => {
                let job = self.hl.snippet_job(code.trim_end_matches('\n'), if lang.is_empty() { "txt" } else { lang }, size * 0.88, self.theme);
                Frame::new()
                    .fill(p.code_bg)
                    .corner_radius(CornerRadius::same(5))
                    .stroke(Stroke::new(1.0, p.border))
                    .inner_margin(Margin::same(10))
                    .show(ui, |ui| {
                        ui.set_width(ui.available_width());
                        if !lang.is_empty() {
                            ui.with_layout(egui::Layout::right_to_left(Align::TOP), |ui| {
                                ui.label(RichText::new(lang).small().color(p.dim));
                            });
                        }
                        egui::ScrollArea::horizontal()
                            .id_salt(code.as_ptr() as usize)
                            .show(ui, |ui| {
                                let mut job = job;
                                job.wrap.max_width = f32::INFINITY;
                                ui.add(egui::Label::new(job).extend());
                            });
                    });
            }
            Block::List(start, items) => {
                for (i, item) in items.iter().enumerate() {
                    ui.horizontal_top(|ui| {
                        ui.add_space(4.0);
                        let marker_w = size * 1.6;
                        if let Some((checked, off)) = item.task {
                            let mut c = checked;
                            let r = ui.add_sized([marker_w, size * 1.3], egui::Checkbox::without_text(&mut c));
                            if r.clicked() {
                                self.clicked_task = Some(off);
                            }
                        } else {
                            let m = match start {
                                Some(s) => format!("{}.", s + i as u64),
                                None => "•".to_string(),
                            };
                            ui.add_sized(
                                [marker_w, size * 1.3],
                                egui::Label::new(RichText::new(m).size(size).color(p.accent)),
                            );
                        }
                        ui.vertical(|ui| {
                            ui.spacing_mut().item_spacing.y = 2.0;
                            let mut sub = Renderer { hl: self.hl, theme: self.theme, size: self.size, clicked_task: None };
                            if let (Some((true, _)), [Block::Para(inl)]) = (item.task, item.blocks.as_slice()) {
                                let mut inl = inl.clone();
                                for s in &mut inl {
                                    s.style.strike = true;
                                }
                                sub.inline(ui, &inl, size, p.dim);
                            } else {
                                for (bi, b) in item.blocks.iter().enumerate() {
                                    if bi > 0 {
                                        ui.add_space(3.0);
                                    }
                                    sub.block(ui, b);
                                }
                            }
                            if sub.clicked_task.is_some() {
                                self.clicked_task = sub.clicked_task;
                            }
                        });
                    });
                }
            }
            Block::Rule => {
                ui.add_space(4.0);
                let r = ui.available_rect_before_wrap();
                ui.painter().hline(r.x_range(), r.top(), Stroke::new(1.5, p.faint));
                ui.add_space(6.0);
            }
            Block::Table(aligns, head, rows) => {
                Frame::new()
                    .stroke(Stroke::new(1.0, p.faint))
                    .corner_radius(CornerRadius::same(4))
                    .inner_margin(Margin::same(6))
                    .show(ui, |ui| {
                        egui::Grid::new(head.as_ptr() as usize)
                            .striped(true)
                            .spacing([18.0, 6.0])
                            .show(ui, |ui| {
                                for (ci, cell) in head.iter().enumerate() {
                                    let mut c = cell.clone();
                                    for s in &mut c {
                                        s.style.strong = true;
                                    }
                                    self.cell(ui, &c, aligns.get(ci).copied().unwrap_or(Alignment::None), p.heading);
                                }
                                ui.end_row();
                                for row in rows {
                                    for (ci, cell) in row.iter().enumerate() {
                                        self.cell(ui, cell, aligns.get(ci).copied().unwrap_or(Alignment::None), p.text);
                                    }
                                    ui.end_row();
                                }
                            });
                    });
            }
            Block::Html(h) => {
                ui.label(RichText::new(h.trim_end()).monospace().size(size * 0.85).color(p.dim));
            }
        }
    }

    fn cell(&self, ui: &mut Ui, inl: &Inline, a: Alignment, color: Color32) {
        let job = self.inline_job(inl, self.size, color, FontFamily::Proportional, f32::INFINITY);
        let layout = match a {
            Alignment::Right => egui::Layout::right_to_left(Align::Center),
            Alignment::Center => egui::Layout::top_down(Align::Center),
            _ => egui::Layout::left_to_right(Align::Center),
        };
        ui.with_layout(layout, |ui| {
            ui.add(egui::Label::new(job).sense(Sense::hover()));
        });
    }
}

/// Full HTML page for "Export as HTML".
pub fn to_html(src: &str, title: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_FOOTNOTES);
    let mut body = String::new();
    pulldown_cmark::html::push_html(&mut body, Parser::new_ext(src, opts));
    let title = title.replace('<', "&lt;");
    format!(
        "<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>{title}</title>\n<style>\nbody{{max-width:760px;margin:40px auto;padding:0 16px;font:16px/1.6 system-ui,sans-serif;color:#24292f}}\ncode,pre{{font-family:ui-monospace,monospace;background:#f3f1ec;border-radius:4px}}\ncode{{padding:1px 4px}}pre{{padding:12px;overflow:auto}}\nblockquote{{border-left:3px solid #e0883e;margin:0;padding-left:14px;color:#57606a}}\ntable{{border-collapse:collapse}}td,th{{border:1px solid #d0d7de;padding:4px 10px}}\nh1,h2{{border-bottom:1px solid #e5e2da;padding-bottom:4px}}\n</style></head><body>\n{body}</body></html>\n"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_common_blocks() {
        let src = "# H\n\npara *x*\n\n- a\n- [x] b\n\n> q\n\n```rust\nfn f(){}\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n---\n";
        let b = parse(src);
        assert!(matches!(b[0], Block::Heading(1, _)));
        assert!(matches!(b[1], Block::Para(_)));
        match &b[2] {
            Block::List(None, items) => {
                assert_eq!(items.len(), 2);
                let (checked, off) = items[1].task.unwrap();
                assert!(checked);
                assert_eq!(&src[off..off + 3], "[x]");
            }
            other => panic!("{other:?}"),
        }
        assert!(matches!(b[3], Block::Quote(_)));
        assert!(matches!(b[4], Block::Code(_, _)));
        assert!(matches!(b[5], Block::Table(_, _, _)));
        assert!(matches!(b[6], Block::Rule));
    }
}
