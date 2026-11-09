//! Every user-facing command, with its label and keyboard shortcut.

use egui::{Key, KeyboardShortcut, Modifiers};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Cmd {
    NewFile,
    OpenFile,
    OpenFolder,
    Save,
    SaveAs,
    SaveAll,
    CloseTab,
    ExportHtml,
    Quit,
    Find,
    Replace,
    FindNext,
    FindPrev,
    Bold,
    Italic,
    Strike,
    InlineCode,
    Link,
    Image,
    H1,
    H2,
    H3,
    H4,
    Paragraph,
    Bullet,
    Numbered,
    Task,
    Quote,
    CodeBlock,
    Table,
    Rule,
    FormatTable,
    CleanDocument,
    Indent,
    Outdent,
    ToggleSidebar,
    ToggleMinimap,
    ToggleWrap,
    ToggleToolbar,
    ViewEdit,
    ViewSplit,
    ViewPreview,
    CyclePreview,
    ToggleReadOnly,
    ThemeDark,
    ThemeLight,
    ZoomIn,
    ZoomOut,
    ZoomReset,
    GotoAnything,
    CommandPalette,
    GotoHeading,
    GotoLine,
    SetSyntax,
    NextTab,
    PrevTab,
    Cheatsheet,
    About,
}

const fn sc(m: Modifiers, k: Key) -> Option<KeyboardShortcut> {
    Some(KeyboardShortcut::new(m, k))
}

const CMD: Modifiers = Modifiers::COMMAND;
const CMD_SHIFT: Modifiers = Modifiers::COMMAND.plus(Modifiers::SHIFT);
const CMD_ALT: Modifiers = Modifiers::COMMAND.plus(Modifiers::ALT);

impl Cmd {
    pub const ALL: &'static [Cmd] = &[
        Cmd::NewFile,
        Cmd::OpenFile,
        Cmd::OpenFolder,
        Cmd::Save,
        Cmd::SaveAs,
        Cmd::SaveAll,
        Cmd::CloseTab,
        Cmd::ExportHtml,
        Cmd::Quit,
        Cmd::Find,
        Cmd::Replace,
        Cmd::FindNext,
        Cmd::FindPrev,
        Cmd::Bold,
        Cmd::Italic,
        Cmd::Strike,
        Cmd::InlineCode,
        Cmd::Link,
        Cmd::Image,
        Cmd::H1,
        Cmd::H2,
        Cmd::H3,
        Cmd::H4,
        Cmd::Paragraph,
        Cmd::Bullet,
        Cmd::Numbered,
        Cmd::Task,
        Cmd::Quote,
        Cmd::CodeBlock,
        Cmd::Table,
        Cmd::Rule,
        Cmd::FormatTable,
        Cmd::CleanDocument,
        Cmd::Indent,
        Cmd::Outdent,
        Cmd::ToggleSidebar,
        Cmd::ToggleMinimap,
        Cmd::ToggleWrap,
        Cmd::ToggleToolbar,
        Cmd::ViewEdit,
        Cmd::ViewSplit,
        Cmd::ViewPreview,
        Cmd::CyclePreview,
        Cmd::ToggleReadOnly,
        Cmd::ThemeDark,
        Cmd::ThemeLight,
        Cmd::ZoomIn,
        Cmd::ZoomOut,
        Cmd::ZoomReset,
        Cmd::GotoAnything,
        Cmd::CommandPalette,
        Cmd::GotoHeading,
        Cmd::GotoLine,
        Cmd::SetSyntax,
        Cmd::NextTab,
        Cmd::PrevTab,
        Cmd::Cheatsheet,
        Cmd::About,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Cmd::NewFile => "File: New",
            Cmd::OpenFile => "File: Open…",
            Cmd::OpenFolder => "File: Open Folder…",
            Cmd::Save => "File: Save",
            Cmd::SaveAs => "File: Save As…",
            Cmd::SaveAll => "File: Save All",
            Cmd::CloseTab => "File: Close Tab",
            Cmd::ExportHtml => "File: Export as HTML…",
            Cmd::Quit => "File: Quit",
            Cmd::Find => "Find",
            Cmd::Replace => "Find and Replace",
            Cmd::FindNext => "Find Next",
            Cmd::FindPrev => "Find Previous",
            Cmd::Bold => "Format: Bold",
            Cmd::Italic => "Format: Italic",
            Cmd::Strike => "Format: Strikethrough",
            Cmd::InlineCode => "Format: Inline Code",
            Cmd::Link => "Insert: Link",
            Cmd::Image => "Insert: Image",
            Cmd::H1 => "Format: Heading 1",
            Cmd::H2 => "Format: Heading 2",
            Cmd::H3 => "Format: Heading 3",
            Cmd::H4 => "Format: Heading 4",
            Cmd::Paragraph => "Format: Normal Text",
            Cmd::Bullet => "Format: Bulleted List",
            Cmd::Numbered => "Format: Numbered List",
            Cmd::Task => "Format: Task List",
            Cmd::Quote => "Format: Quote",
            Cmd::CodeBlock => "Insert: Code Block",
            Cmd::Table => "Insert: Table",
            Cmd::Rule => "Insert: Horizontal Rule",
            Cmd::FormatTable => "Format: Align Table",
            Cmd::CleanDocument => "Format: Clean Up Document",
            Cmd::Indent => "Edit: Indent",
            Cmd::Outdent => "Edit: Outdent",
            Cmd::ToggleSidebar => "View: Toggle Side Bar",
            Cmd::ToggleMinimap => "View: Toggle Minimap",
            Cmd::ToggleWrap => "View: Toggle Word Wrap",
            Cmd::ToggleToolbar => "View: Toggle Formatting Bar",
            Cmd::ViewEdit => "View: Editor Only",
            Cmd::ViewSplit => "View: Editor + Preview",
            Cmd::ViewPreview => "View: Preview Only",
            Cmd::CyclePreview => "View: Cycle Preview",
            Cmd::ToggleReadOnly => "View: Toggle Read Only",
            Cmd::ThemeDark => "Theme: Dark",
            Cmd::ThemeLight => "Theme: Light",
            Cmd::ZoomIn => "View: Larger Text",
            Cmd::ZoomOut => "View: Smaller Text",
            Cmd::ZoomReset => "View: Reset Text Size",
            Cmd::GotoAnything => "Go to File…",
            Cmd::CommandPalette => "Command Palette",
            Cmd::GotoHeading => "Go to Heading…",
            Cmd::GotoLine => "Go to Line…",
            Cmd::SetSyntax => "Set Syntax…",
            Cmd::NextTab => "Next Tab",
            Cmd::PrevTab => "Previous Tab",
            Cmd::Cheatsheet => "Help: Markdown Cheat Sheet",
            Cmd::About => "Help: About",
        }
    }

    /// Short label for menus (without the "Group:" prefix).
    pub fn short(self) -> &'static str {
        let l = self.label();
        match l.find(": ") {
            Some(i) => &l[i + 2..],
            None => l,
        }
    }

    pub fn shortcut(self) -> Option<KeyboardShortcut> {
        match self {
            Cmd::NewFile => sc(CMD, Key::N),
            Cmd::OpenFile => sc(CMD, Key::O),
            Cmd::OpenFolder => sc(CMD_SHIFT, Key::O),
            Cmd::Save => sc(CMD, Key::S),
            Cmd::SaveAs => sc(CMD_SHIFT, Key::S),
            Cmd::CloseTab => sc(CMD, Key::W),
            Cmd::ExportHtml => sc(CMD_SHIFT, Key::E),
            Cmd::Quit => sc(CMD, Key::Q),
            Cmd::Find => sc(CMD, Key::F),
            Cmd::Replace => sc(CMD, Key::H),
            Cmd::FindNext => sc(Modifiers::NONE, Key::F3),
            Cmd::FindPrev => sc(Modifiers::SHIFT, Key::F3),
            Cmd::Bold => sc(CMD, Key::B),
            Cmd::Italic => sc(CMD, Key::I),
            Cmd::Strike => sc(CMD_SHIFT, Key::X),
            Cmd::InlineCode => sc(CMD, Key::Backtick),
            Cmd::Link => sc(CMD, Key::K),
            Cmd::Image => sc(CMD_SHIFT, Key::K),
            Cmd::H1 => sc(CMD, Key::Num1),
            Cmd::H2 => sc(CMD, Key::Num2),
            Cmd::H3 => sc(CMD, Key::Num3),
            Cmd::H4 => sc(CMD, Key::Num4),
            Cmd::Paragraph => sc(CMD, Key::Num0),
            Cmd::Bullet => sc(CMD_SHIFT, Key::U),
            Cmd::Numbered => sc(CMD_SHIFT, Key::N),
            Cmd::Task => sc(CMD_SHIFT, Key::T),
            Cmd::Quote => sc(CMD_SHIFT, Key::Q),
            Cmd::CodeBlock => sc(CMD_SHIFT, Key::C),
            Cmd::CleanDocument => sc(CMD_SHIFT, Key::F),
            Cmd::FormatTable => sc(CMD_ALT, Key::T),
            Cmd::Indent => sc(CMD, Key::CloseBracket),
            Cmd::Outdent => sc(CMD, Key::OpenBracket),
            Cmd::ToggleSidebar => sc(CMD, Key::Backslash),
            Cmd::ToggleWrap => sc(Modifiers::ALT, Key::Z),
            Cmd::ViewEdit => sc(CMD_ALT, Key::Num1),
            Cmd::ViewSplit => sc(CMD_ALT, Key::Num2),
            Cmd::ViewPreview => sc(CMD_ALT, Key::Num3),
            Cmd::CyclePreview => sc(CMD_SHIFT, Key::V),
            Cmd::ZoomIn => sc(CMD, Key::Equals),
            Cmd::ZoomOut => sc(CMD, Key::Minus),
            Cmd::GotoAnything => sc(CMD, Key::P),
            Cmd::CommandPalette => sc(CMD_SHIFT, Key::P),
            Cmd::GotoHeading => sc(CMD, Key::R),
            Cmd::GotoLine => sc(CMD, Key::G),
            Cmd::NextTab => sc(CMD, Key::Tab),
            Cmd::PrevTab => sc(CMD_SHIFT, Key::Tab),
            Cmd::Cheatsheet => sc(Modifiers::NONE, Key::F1),
            _ => None,
        }
    }

    /// Commands that only make sense in markdown documents.
    pub fn markdown_only(self) -> bool {
        matches!(
            self,
            Cmd::Bold
                | Cmd::Italic
                | Cmd::Strike
                | Cmd::InlineCode
                | Cmd::Link
                | Cmd::Image
                | Cmd::H1
                | Cmd::H2
                | Cmd::H3
                | Cmd::H4
                | Cmd::Paragraph
                | Cmd::Bullet
                | Cmd::Numbered
                | Cmd::Task
                | Cmd::Quote
                | Cmd::CodeBlock
                | Cmd::Table
                | Cmd::Rule
                | Cmd::FormatTable
                | Cmd::CleanDocument
                | Cmd::ViewEdit
                | Cmd::ViewSplit
                | Cmd::ViewPreview
                | Cmd::CyclePreview
                | Cmd::ExportHtml
                | Cmd::GotoHeading
        )
    }
}

/// Subsequence fuzzy match. Higher is better; `None` when not all query chars appear in order.
pub fn fuzzy_score(hay: &str, query: &str) -> Option<i32> {
    if query.is_empty() {
        return Some(0);
    }
    let h: Vec<char> = hay.to_lowercase().chars().collect();
    let orig: Vec<char> = hay.chars().collect();
    let mut score = 0;
    let mut hi = 0;
    let mut prev_match: Option<usize> = None;
    for qc in query.to_lowercase().chars() {
        if qc == ' ' {
            continue;
        }
        let mut found = None;
        while hi < h.len() {
            if h[hi] == qc {
                found = Some(hi);
                break;
            }
            hi += 1;
        }
        let i = found?;
        score += 10;
        if prev_match.map(|p| p + 1 == i).unwrap_or(false) {
            score += 15;
        }
        if i == 0 || !orig.get(i - 1).map(|c| c.is_alphanumeric()).unwrap_or(false) {
            score += 20;
        }
        prev_match = Some(i);
        hi = i + 1;
    }
    score -= h.len() as i32 / 4;
    Some(score)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fuzzy() {
        assert!(fuzzy_score("Format: Bold", "bold").is_some());
        assert!(fuzzy_score("Format: Bold", "xyz").is_none());
        assert!(fuzzy_score("Toggle Side Bar", "tsb").unwrap() > fuzzy_score("Toggle Side Bar", "ogl").unwrap());
    }
}
