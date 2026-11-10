---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0012 — Serve local images through a scoped asset protocol, and block remote images

## Context

The preview shows Markdown that the user did not write, such as a downloaded
README. The Markdown can carry raw HTML. The webview can call the app
commands, so the preview must never run script. The preview also loads
images: local ones next to the file, and remote ones. A remote image tells
its host that the user opened the file.

## Decision Drivers

- Hostile Markdown must not run code in the webview
- Opening a file must not contact the network by default
- A relative image path must work, from any folder
- The webview must not read files that the user did not open

## Considered Options

- **Allow all file access (`asset:` with scope `**`):** images work everywhere, but a hostile page could ask for any file.
- **Embed local images as data URLs in the preview:** no protocol, but every image crosses the IPC boundary on each render. This is slow.
- **Scoped asset protocol:** the core allows the folder of each open file, and its sub-folders. The webview loads images from there only.

## Decision

We will use the **Tauri asset protocol with a runtime scope**. When the user
opens or saves a file, the core adds the folder of that file to the scope.
The sanitizer (DOMPurify, with extra rules) rewrites each local image to an
asset URL. It blocks remote images unless the setting `markdown.remoteImages`
is on. A click on a link never navigates the webview: the app opens a file in
a tab, scrolls to a heading, or opens a web link in the system browser.

## Consequences

- The sanitizer has an allow list of tags and of URL schemes. It removes `style`, `srcset`, forms, frames, SVG, and non-checkbox inputs. `sanitize.test.ts` holds the attack cases. Every change to the sanitizer needs a test.
- A relative image in a file that was never saved does not load. The preview says so.
- The scope only grows during a session. It resets when the app restarts.
- The HTML export embeds local images as data URLs, so the exported file needs nothing else. The export reads images only (`read_image` refuses other file types).
- Images that the user pastes go in the folder set by `markdown.imageDir`. The setting cannot leave the folder of the file.
- The content security policy allows `https:` images, because the setting `markdown.remoteImages` needs them. This means the policy no longer blocks a remote image on its own. **The sanitizer is the only gate** for the privacy default. `sanitize.test.ts` tests it. The policy still blocks script, frames, and every other remote resource (`default-src 'self'`).
