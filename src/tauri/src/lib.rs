use std::path::PathBuf;

use ox_fs::{Decoded, Eol};
use serde::Serialize;
use serde_json::Value;
use tauri::Manager;

const DEFAULT_SETTINGS: &str = include_str!("../default-settings.jsonc");

#[derive(Serialize)]
struct OpenedFile {
    path: String,
    #[serde(flatten)]
    decoded: Decoded,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Config {
    /// Default settings, with the user settings on top.
    settings: Value,
    /// The user keybindings. The default keymap is in the frontend.
    keybindings: Value,
    /// Errors in the config files. The editor still starts.
    errors: Vec<String>,
    config_dir: String,
}

#[tauri::command]
fn open_file(path: String) -> Result<OpenedFile, ox_fs::Error> {
    let decoded = ox_fs::read_file(&PathBuf::from(&path))?;
    Ok(OpenedFile { path, decoded })
}

#[tauri::command]
fn save_file(
    path: String,
    text: String,
    encoding: String,
    bom: bool,
    eol: Eol,
) -> Result<(), ox_fs::Error> {
    ox_fs::save_file(&PathBuf::from(path), &text, &encoding, bom, eol)
}

#[tauri::command]
fn load_config(app: tauri::AppHandle) -> Config {
    let dir = app.path().app_config_dir().unwrap_or_default();
    let mut errors = Vec::new();
    let mut read = |name: &str| match ox_settings::read_jsonc(&dir.join(name)) {
        Ok(v) => v,
        Err(e) => {
            errors.push(e.to_string());
            Value::Null
        }
    };
    let user_settings = read("settings.jsonc");
    let keybindings = read("keybindings.jsonc");
    let defaults = ox_settings::parse_jsonc(DEFAULT_SETTINGS).unwrap_or(Value::Null);
    Config {
        settings: ox_settings::merge_layers([defaults, user_settings]),
        keybindings: if keybindings.is_array() { keybindings } else { Value::Array(vec![]) },
        errors,
        config_dir: dir.display().to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![open_file, save_file, load_config])
        .run(tauri::generate_context!())
        .expect("error while running oxide-text");
}
