//! File I/O for oxide-text: decode and encode text with its encoding, byte
//! order mark, and line endings, and write files atomically.
//!
//! The editor buffer always uses `\n`. [`decode`] converts to `\n` and records
//! the original line ending. [`encode`] converts back.

use std::io::Write;
use std::path::Path;

use chardetng::EncodingDetector;
use encoding_rs::{Encoding, UTF_16BE, UTF_16LE, UTF_8};
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("the file looks like a binary file")]
    Binary,
    #[error("unknown encoding: {0}")]
    UnknownEncoding(String),
    #[error("the text has characters that {0} cannot hold")]
    Unmappable(String),
}

impl Serialize for Error {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Eol {
    Lf,
    Crlf,
    Cr,
}

impl Eol {
    fn as_str(self) -> &'static str {
        match self {
            Eol::Lf => "\n",
            Eol::Crlf => "\r\n",
            Eol::Cr => "\r",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Decoded {
    /// The text, with `\n` line endings.
    pub text: String,
    /// The encoding label, such as `UTF-8` or `windows-1252`.
    pub encoding: String,
    /// True if the file starts with a byte order mark.
    pub bom: bool,
    /// The most common line ending in the file. `Lf` if the file has none.
    pub eol: Eol,
    /// True if the file mixes line endings. Saving makes them all the same.
    pub mixed_eol: bool,
}

/// Decode the bytes of a file.
pub fn decode(bytes: &[u8]) -> Result<Decoded, Error> {
    let (encoding, bom) = match Encoding::for_bom(bytes) {
        Some((enc, _)) => (enc, true),
        None => (detect(bytes)?, false),
    };
    let (text, _) = encoding.decode_with_bom_removal(bytes);
    let (text, eol, mixed_eol) = normalise_eol(&text);
    Ok(Decoded {
        text,
        encoding: encoding.name().to_string(),
        bom,
        eol,
        mixed_eol,
    })
}

fn detect(bytes: &[u8]) -> Result<&'static Encoding, Error> {
    let head = &bytes[..bytes.len().min(8192)];
    if head.contains(&0) {
        return Err(Error::Binary);
    }
    if std::str::from_utf8(bytes).is_ok() {
        return Ok(UTF_8);
    }
    let mut detector = EncodingDetector::new();
    detector.feed(bytes, true);
    Ok(detector.guess(None, true))
}

fn normalise_eol(text: &str) -> (String, Eol, bool) {
    let (mut lf, mut crlf, mut cr) = (0usize, 0usize, 0usize);
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();
    while let Some(c) = chars.next() {
        match c {
            '\r' => {
                if chars.peek() == Some(&'\n') {
                    chars.next();
                    crlf += 1;
                } else {
                    cr += 1;
                }
                out.push('\n');
            }
            '\n' => {
                lf += 1;
                out.push('\n');
            }
            _ => out.push(c),
        }
    }
    let kinds = [lf, crlf, cr].iter().filter(|n| **n > 0).count();
    let eol = if crlf > lf && crlf >= cr {
        Eol::Crlf
    } else if cr > lf && cr > crlf {
        Eol::Cr
    } else {
        Eol::Lf
    };
    (out, eol, kinds > 1)
}

/// Encode text for saving. `text` uses `\n` line endings.
pub fn encode(text: &str, encoding: &str, bom: bool, eol: Eol) -> Result<Vec<u8>, Error> {
    let enc = Encoding::for_label(encoding.as_bytes())
        .ok_or_else(|| Error::UnknownEncoding(encoding.to_string()))?;
    let text = if eol == Eol::Lf {
        std::borrow::Cow::Borrowed(text)
    } else {
        std::borrow::Cow::Owned(text.replace('\n', eol.as_str()))
    };

    let mut out = Vec::with_capacity(text.len() + 4);
    // encoding_rs cannot encode UTF-16, so encode it here.
    if enc == UTF_16LE || enc == UTF_16BE {
        let le = enc == UTF_16LE;
        let put = |out: &mut Vec<u8>, u: u16| {
            out.extend_from_slice(&if le { u.to_le_bytes() } else { u.to_be_bytes() })
        };
        if bom {
            put(&mut out, 0xFEFF);
        }
        for u in text.encode_utf16() {
            put(&mut out, u);
        }
        return Ok(out);
    }

    if bom {
        if enc == UTF_8 {
            out.extend_from_slice(&[0xEF, 0xBB, 0xBF]);
        }
    }
    let (bytes, _, had_unmappable) = enc.encode(&text);
    if had_unmappable {
        return Err(Error::Unmappable(enc.name().to_string()));
    }
    out.extend_from_slice(&bytes);
    Ok(out)
}

pub fn read_file(path: &Path) -> Result<Decoded, Error> {
    decode(&std::fs::read(path)?)
}

/// Write a file atomically: write a temporary file in the same folder, then
/// rename it over the target.
pub fn write_atomic(path: &Path, bytes: &[u8]) -> Result<(), Error> {
    let dir = path.parent().filter(|p| !p.as_os_str().is_empty()).unwrap_or(Path::new("."));
    let mut tmp = tempfile_in(dir)?;
    tmp.0.write_all(bytes)?;
    tmp.0.sync_all()?;
    // Keep the permissions of an existing file.
    if let Ok(meta) = std::fs::metadata(path) {
        let _ = std::fs::set_permissions(&tmp.1, meta.permissions());
    }
    std::fs::rename(&tmp.1, path)?;
    Ok(())
}

fn tempfile_in(dir: &Path) -> std::io::Result<(std::fs::File, std::path::PathBuf)> {
    let pid = std::process::id();
    for n in 0..1000u32 {
        let p = dir.join(format!(".oxide-save-{pid}-{n}.tmp"));
        match std::fs::OpenOptions::new().write(true).create_new(true).open(&p) {
            Ok(f) => return Ok((f, p)),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e),
        }
    }
    Err(std::io::Error::new(std::io::ErrorKind::AlreadyExists, "no free temporary name"))
}

pub fn save_file(
    path: &Path,
    text: &str,
    encoding: &str,
    bom: bool,
    eol: Eol,
) -> Result<(), Error> {
    write_atomic(path, &encode(text, encoding, bom, eol)?)
}

/// Save binary data to `dir/<stem>-<n>.<ext>`, with the smallest `n` (from 1) that
/// is free. Makes `dir` if it does not exist. Returns the path of the new file.
/// `stem` and `ext` must be plain names: no path separators, and `ext` has only
/// letters and digits.
pub fn save_unique(dir: &Path, stem: &str, ext: &str, bytes: &[u8]) -> Result<std::path::PathBuf, Error> {
    let bad = |s: &str| s.is_empty() || s.contains(['/', '\\', '\0']) || s == "." || s == "..";
    if bad(stem) || ext.is_empty() || ext.len() > 8 || !ext.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "bad file name",
        )));
    }
    std::fs::create_dir_all(dir)?;
    for n in 1..100_000u32 {
        let p = dir.join(format!("{stem}-{n}.{ext}"));
        match std::fs::OpenOptions::new().write(true).create_new(true).open(&p) {
            Ok(mut f) => {
                f.write_all(bytes)?;
                f.sync_all()?;
                return Ok(p);
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.into()),
        }
    }
    Err(Error::Io(std::io::Error::new(std::io::ErrorKind::AlreadyExists, "no free file name")))
}

/// True if the path has an image file extension that the preview can show.
pub fn is_image_path(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref(),
        Some("png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "bmp" | "avif" | "ico")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn utf8_lf() {
        let d = decode(b"a\nb\n").unwrap();
        assert_eq!((d.text.as_str(), d.encoding.as_str(), d.bom, d.eol, d.mixed_eol), ("a\nb\n", "UTF-8", false, Eol::Lf, false));
    }

    #[test]
    fn utf8_bom_is_removed_and_recorded() {
        let d = decode(b"\xEF\xBB\xBFhi").unwrap();
        assert_eq!(d.text, "hi");
        assert!(d.bom);
    }

    #[test]
    fn crlf_is_detected_and_normalised() {
        let d = decode(b"a\r\nb\r\n").unwrap();
        assert_eq!(d.text, "a\nb\n");
        assert_eq!(d.eol, Eol::Crlf);
        assert!(!d.mixed_eol);
    }

    #[test]
    fn mixed_line_endings_are_flagged() {
        let d = decode(b"a\r\nb\r\nc\nd").unwrap();
        assert_eq!(d.eol, Eol::Crlf);
        assert!(d.mixed_eol);
        assert_eq!(d.text, "a\nb\nc\nd");
    }

    #[test]
    fn utf16_round_trip() {
        let bytes = encode("héllo\nworld", "UTF-16LE", true, Eol::Crlf).unwrap();
        assert_eq!(&bytes[..2], &[0xFF, 0xFE]);
        let d = decode(&bytes).unwrap();
        assert_eq!(d.text, "héllo\nworld");
        assert_eq!(d.encoding, "UTF-16LE");
        assert_eq!(d.eol, Eol::Crlf);
        assert!(d.bom);
    }

    #[test]
    fn latin1_round_trip() {
        let src = b"caf\xe9 au lait\n";
        let d = decode(src).unwrap();
        assert_eq!(d.text, "café au lait\n");
        assert_eq!(d.encoding, "windows-1252");
        assert_eq!(encode(&d.text, &d.encoding, d.bom, d.eol).unwrap(), src);
    }

    #[test]
    fn binary_is_refused() {
        assert!(matches!(decode(b"abc\0def"), Err(Error::Binary)));
    }

    #[test]
    fn unmappable_characters_are_an_error() {
        assert!(matches!(encode("日本", "windows-1252", false, Eol::Lf), Err(Error::Unmappable(_))));
    }

    #[test]
    fn unknown_encoding_is_an_error() {
        assert!(matches!(encode("a", "nope", false, Eol::Lf), Err(Error::UnknownEncoding(_))));
    }

    #[test]
    fn save_is_atomic_and_leaves_no_temp_file() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("a.md");
        save_file(&p, "one\n", "UTF-8", false, Eol::Lf).unwrap();
        save_file(&p, "two\n", "UTF-8", false, Eol::Crlf).unwrap();
        assert_eq!(std::fs::read(&p).unwrap(), b"two\r\n");
        let names: Vec<_> = std::fs::read_dir(dir.path()).unwrap().map(|e| e.unwrap().file_name()).collect();
        assert_eq!(names.len(), 1);
    }

    #[test]
    fn save_unique_picks_the_next_free_name_and_makes_the_folder() {
        let dir = tempfile::tempdir().unwrap();
        let assets = dir.path().join("assets");
        let a = save_unique(&assets, "note", "png", b"1").unwrap();
        let b = save_unique(&assets, "note", "png", b"2").unwrap();
        assert_eq!(a.file_name().unwrap(), "note-1.png");
        assert_eq!(b.file_name().unwrap(), "note-2.png");
        std::fs::remove_file(&a).unwrap();
        // The smallest free number is reused.
        assert_eq!(save_unique(&assets, "note", "png", b"3").unwrap().file_name().unwrap(), "note-1.png");
        assert_eq!(std::fs::read(&b).unwrap(), b"2");
    }

    #[test]
    fn save_unique_refuses_a_path_in_the_name() {
        let dir = tempfile::tempdir().unwrap();
        assert!(save_unique(dir.path(), "../evil", "png", b"x").is_err());
        assert!(save_unique(dir.path(), "a/b", "png", b"x").is_err());
        assert!(save_unique(dir.path(), "ok", "p/ng", b"x").is_err());
        assert!(save_unique(dir.path(), "ok", "", b"x").is_err());
    }

    #[test]
    fn image_paths() {
        assert!(is_image_path(Path::new("a/b.PNG")));
        assert!(!is_image_path(Path::new("a/b.rs")));
        assert!(!is_image_path(Path::new("a/b")));
    }

    #[test]
    fn ten_megabyte_file_round_trips() {
        let line = "The quick brown fox jumps over the lazy dog.\r\n";
        let src = line.repeat(10 * 1024 * 1024 / line.len());
        let d = decode(src.as_bytes()).unwrap();
        assert_eq!(d.eol, Eol::Crlf);
        let out = encode(&d.text, &d.encoding, d.bom, d.eol).unwrap();
        assert_eq!(out, src.as_bytes());
    }
}
