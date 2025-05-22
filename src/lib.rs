pub mod parser;
pub mod renderer;

mod parser_test;
mod renderer_test;

pub use parser::{parse, length, Part, StyleKind, EmoteKind, Color};
pub use renderer::render;
