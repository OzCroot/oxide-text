//! Layered JSONC settings for oxide-text.
//!
//! Layers run from low to high priority. A later layer overrides an earlier
//! one. Objects merge key by key. Every other value, including an array,
//! replaces the earlier value.

use std::path::Path;

use serde_json::{Map, Value};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("{path}: {message}")]
    Parse { path: String, message: String },
    #[error("{0}")]
    Io(#[from] std::io::Error),
}

/// Parse JSONC text. Empty text gives `Value::Null`.
pub fn parse_jsonc(text: &str) -> Result<Value, String> {
    let value = jsonc_parser::parse_to_serde_value(text, &Default::default())
        .map_err(|e| e.to_string())?;
    Ok(value.unwrap_or(Value::Null))
}

/// Read a JSONC file. A missing file gives `Value::Null`.
pub fn read_jsonc(path: &Path) -> Result<Value, Error> {
    match std::fs::read_to_string(path) {
        Ok(text) => parse_jsonc(&text).map_err(|message| Error::Parse {
            path: path.display().to_string(),
            message,
        }),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Value::Null),
        Err(e) => Err(e.into()),
    }
}

/// Merge `over` onto `base`.
pub fn merge(base: Value, over: Value) -> Value {
    match (base, over) {
        (Value::Object(mut b), Value::Object(o)) => {
            for (k, v) in o {
                let merged = match b.remove(&k) {
                    Some(existing) => merge(existing, v),
                    None => v,
                };
                b.insert(k, merged);
            }
            Value::Object(b)
        }
        (base, Value::Null) => base,
        (_, over) => over,
    }
}

/// Merge layers from low to high priority.
pub fn merge_layers(layers: impl IntoIterator<Item = Value>) -> Value {
    layers
        .into_iter()
        .fold(Value::Object(Map::new()), merge)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn jsonc_allows_comments_and_trailing_commas() {
        let v = parse_jsonc("// c\n{ \"a\": 1, /* x */ \"b\": [1,2,], }").unwrap();
        assert_eq!(v, json!({ "a": 1, "b": [1, 2] }));
    }

    #[test]
    fn empty_text_is_null() {
        assert_eq!(parse_jsonc("  // nothing\n").unwrap(), Value::Null);
    }

    #[test]
    fn objects_merge_and_arrays_replace() {
        let base = json!({ "editor": { "a": 1, "b": 2 }, "list": [1, 2] });
        let over = json!({ "editor": { "b": 3 }, "list": [9] });
        assert_eq!(
            merge(base, over),
            json!({ "editor": { "a": 1, "b": 3 }, "list": [9] })
        );
    }

    #[test]
    fn later_layer_wins() {
        let v = merge_layers([json!({ "theme": "light" }), Value::Null, json!({ "theme": "dark" })]);
        assert_eq!(v, json!({ "theme": "dark" }));
    }

    #[test]
    fn missing_file_is_null() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(read_jsonc(&dir.path().join("nope.jsonc")).unwrap(), Value::Null);
    }

    #[test]
    fn parse_error_names_the_file() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("s.jsonc");
        std::fs::write(&p, "{ \"a\": ").unwrap();
        let err = read_jsonc(&p).unwrap_err().to_string();
        assert!(err.contains("s.jsonc"), "{err}");
    }
}
