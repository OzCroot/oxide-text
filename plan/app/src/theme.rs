//! Colours and egui styling for the two built-in themes.

use egui::{Color32, CornerRadius, Stroke, Visuals};

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum ThemeKind {
    Dark,
    Light,
}

/// Every colour the app paints by hand.
#[derive(Clone, Copy)]
pub struct Palette {
    pub bg: Color32,
    pub panel: Color32,
    pub sidebar: Color32,
    pub tab_bar: Color32,
    pub tab_active: Color32,
    pub tab_hover: Color32,
    pub text: Color32,
    pub dim: Color32,
    pub faint: Color32,
    pub accent: Color32,
    pub heading: Color32,
    pub strong: Color32,
    pub emph: Color32,
    pub link: Color32,
    pub code: Color32,
    pub code_bg: Color32,
    pub quote: Color32,
    pub marker: Color32,
    pub selection: Color32,
    pub current_line: Color32,
    pub border: Color32,
    pub find_hit: Color32,
    pub minimap_view: Color32,
}

impl Palette {
    pub fn get(kind: ThemeKind) -> Palette {
        match kind {
            ThemeKind::Dark => Palette {
                bg: Color32::from_rgb(0x26, 0x2b, 0x33),
                panel: Color32::from_rgb(0x1f, 0x23, 0x2a),
                sidebar: Color32::from_rgb(0x1b, 0x1f, 0x25),
                tab_bar: Color32::from_rgb(0x1b, 0x1f, 0x25),
                tab_active: Color32::from_rgb(0x26, 0x2b, 0x33),
                tab_hover: Color32::from_rgb(0x2c, 0x32, 0x3b),
                text: Color32::from_rgb(0xd8, 0xdd, 0xe4),
                dim: Color32::from_rgb(0x7c, 0x86, 0x94),
                faint: Color32::from_rgb(0x4a, 0x52, 0x5e),
                accent: Color32::from_rgb(0xf2, 0x96, 0x4b),
                heading: Color32::from_rgb(0xf5, 0xb3, 0x6b),
                strong: Color32::from_rgb(0xff, 0xd3, 0x8a),
                emph: Color32::from_rgb(0xc5, 0x9b, 0xf0),
                link: Color32::from_rgb(0x6c, 0xb6, 0xf0),
                code: Color32::from_rgb(0x8f, 0xd6, 0x9a),
                code_bg: Color32::from_rgb(0x1c, 0x20, 0x26),
                quote: Color32::from_rgb(0x9a, 0xa5, 0xb3),
                marker: Color32::from_rgb(0xe8, 0x6f, 0x6f),
                selection: Color32::from_rgba_unmultiplied(0x5a, 0x7c, 0xb0, 110),
                current_line: Color32::from_rgba_unmultiplied(0xff, 0xff, 0xff, 9),
                border: Color32::from_rgb(0x14, 0x17, 0x1c),
                find_hit: Color32::from_rgba_unmultiplied(0xf2, 0xc9, 0x4b, 70),
                minimap_view: Color32::from_rgba_unmultiplied(0xff, 0xff, 0xff, 22),
            },
            ThemeKind::Light => Palette {
                bg: Color32::from_rgb(0xfb, 0xfa, 0xf7),
                panel: Color32::from_rgb(0xf0, 0xee, 0xe9),
                sidebar: Color32::from_rgb(0xea, 0xe7, 0xe0),
                tab_bar: Color32::from_rgb(0xe4, 0xe1, 0xd9),
                tab_active: Color32::from_rgb(0xfb, 0xfa, 0xf7),
                tab_hover: Color32::from_rgb(0xef, 0xec, 0xe5),
                text: Color32::from_rgb(0x2b, 0x2f, 0x36),
                dim: Color32::from_rgb(0x80, 0x84, 0x8c),
                faint: Color32::from_rgb(0xc4, 0xc2, 0xbb),
                accent: Color32::from_rgb(0xd0, 0x6a, 0x1c),
                heading: Color32::from_rgb(0xb0, 0x4e, 0x0f),
                strong: Color32::from_rgb(0x8a, 0x3b, 0x00),
                emph: Color32::from_rgb(0x7a, 0x3e, 0xb8),
                link: Color32::from_rgb(0x1d, 0x6f, 0xc4),
                code: Color32::from_rgb(0x2a, 0x7a, 0x3a),
                code_bg: Color32::from_rgb(0xef, 0xec, 0xe4),
                quote: Color32::from_rgb(0x6a, 0x70, 0x78),
                marker: Color32::from_rgb(0xc2, 0x3b, 0x3b),
                selection: Color32::from_rgba_unmultiplied(0x6a, 0x9c, 0xe0, 90),
                current_line: Color32::from_rgba_unmultiplied(0x00, 0x00, 0x00, 8),
                border: Color32::from_rgb(0xd2, 0xce, 0xc4),
                find_hit: Color32::from_rgba_unmultiplied(0xf0, 0xb0, 0x20, 90),
                minimap_view: Color32::from_rgba_unmultiplied(0x00, 0x00, 0x00, 18),
            },
        }
    }
}

/// Apply the theme to egui's own widgets (menus, buttons, text fields).
pub fn apply(ctx: &egui::Context, kind: ThemeKind) {
    let p = Palette::get(kind);
    let mut v = match kind {
        ThemeKind::Dark => Visuals::dark(),
        ThemeKind::Light => Visuals::light(),
    };
    v.panel_fill = p.panel;
    v.window_fill = p.panel;
    v.extreme_bg_color = p.bg;
    v.faint_bg_color = p.tab_hover;
    v.code_bg_color = p.code_bg;
    v.hyperlink_color = p.link;
    v.selection.bg_fill = p.selection;
    v.selection.stroke = Stroke::new(1.0, p.text);
    v.text_cursor.stroke = Stroke::new(2.0, p.accent);
    v.window_corner_radius = CornerRadius::same(6);
    v.menu_corner_radius = CornerRadius::same(4);
    v.window_stroke = Stroke::new(1.0, p.border);
    v.widgets.noninteractive.bg_stroke = Stroke::new(1.0, p.border);
    v.widgets.noninteractive.fg_stroke = Stroke::new(1.0, p.text);
    v.widgets.inactive.fg_stroke = Stroke::new(1.0, p.text);
    v.widgets.inactive.weak_bg_fill = p.tab_hover;
    v.widgets.hovered.weak_bg_fill = p.tab_active;
    v.widgets.active.weak_bg_fill = p.selection;
    ctx.set_visuals(v);

    ctx.style_mut(|s| {
        s.spacing.item_spacing = egui::vec2(6.0, 4.0);
        s.spacing.button_padding = egui::vec2(6.0, 3.0);
    });
}
