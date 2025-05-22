//! Fast and safe sillycode parsing and rendering library.
//!
//! This library provides functionality to parse sillycode markup into structured
//! parts and render them as HTML. For more information on the syntax, see the
//! [sillycode guide](https://sillypost.net/sillycode_guide).
//!
//! # Usage
//!
//! ```rust
//! use sillycode::{parse, render};
//!
//! let input = "[b]Hello[/b] [:)]";
//! let parts = parse(input);
//! let html = render(parts, false);
//!
//! println!("{}", html);
//! ```

pub mod parser;
pub mod renderer;

mod parser_test;
mod renderer_test;

pub use parser::{parse, length, Part, StyleKind, EmoteKind, Color};
pub use renderer::render;
