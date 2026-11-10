use std::path::{Path, PathBuf};

use ox_fs::{Decoded, Eol};
use percent_encoding::percent_decode_str;
use serde::Serialize;
use serde_json::Value;
use tauri::{ipc::Response, Manager};

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

/// Let the preview load images from the folder of an open file, and from its
/// sub-folders. The asset protocol serves nothing outside these folders.
fn allow_folder_of(app: &tauri::AppHandle, file: &Path) {
    if let Some(dir) = file.parent() {
        let _ = app.asset_protocol_scope().allow_directory(dir, true);
    }
}

#[tauri::command]
fn open_file(app: tauri::AppHandle, path: String) -> Result<OpenedFile, ox_fs::Error> {
    let p = PathBuf::from(&path);
    let decoded = ox_fs::read_file(&p)?;
    allow_folder_of(&app, &p);
    Ok(OpenedFile { path, decoded })
}

#[tauri::command]
fn save_file(
    app: tauri::AppHandle,
    path: String,
    text: String,
    encoding: String,
    bom: bool,
    eol: Eol,
) -> Result<(), ox_fs::Error> {
    let p = PathBuf::from(path);
    ox_fs::save_file(&p, &text, &encoding, bom, eol)?;
    allow_folder_of(&app, &p);
    Ok(())
}

/// For each path, tell if it exists. The preview uses this to mark broken links.
#[tauri::command]
fn check_paths(paths: Vec<String>) -> Vec<bool> {
    paths.iter().map(|p| Path::new(p).exists()).collect()
}

/// Read an image file. Only image files are allowed. Used to embed images in an HTML export.
#[tauri::command]
fn read_image(path: String) -> Result<Response, ox_fs::Error> {
    let p = PathBuf::from(path);
    if !ox_fs::is_image_path(&p) {
        return Err(ox_fs::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "not an image file",
        )));
    }
    Ok(Response::new(std::fs::read(p)?))
}

/// Save pasted image data. The body is the raw bytes. The headers `x-dir`, `x-stem`, and
/// `x-ext` hold the target folder, the file name stem, and the extension (percent-encoded).
/// Returns the path of the new file. See `ox_fs::save_unique` for the naming.
#[tauri::command]
fn save_image(app: tauri::AppHandle, request: tauri::ipc::Request) -> Result<String, ox_fs::Error> {
    let header = |name: &str| -> String {
        request
            .headers()
            .get(name)
            .and_then(|v| v.to_str().ok())
            .map(|v| percent_decode_str(v).decode_utf8_lossy().into_owned())
            .unwrap_or_default()
    };
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else {
        return Err(ox_fs::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "expected raw image data",
        )));
    };
    let dir = PathBuf::from(header("x-dir"));
    let path = ox_fs::save_unique(&dir, &header("x-stem"), &header("x-ext"), bytes)?;
    allow_folder_of(&app, &path);
    Ok(path.display().to_string())
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_file,
            save_file,
            check_paths,
            read_image,
            save_image,
            load_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running oxide-text");
}
