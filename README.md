# sillycode
This repository provides fast and safe implementations of [sillycode](https://sillypost.net/sillycode_guide) parsing and rendering in both JavaScript/TypeScript and Rust.

## Installation

### JavaScript/TypeScript
```bash
npm install sillycode
```

### Rust
```toml
[dependencies]
sillycode = "0.0.3"
```

## Usage

### JavaScript/TypeScript
```typescript
import { parse, render } from 'sillycode';

const input = "[b]Hello[/b] [:)]";
const parts = parse(input);
const html = render(parts, false);

console.log(html);
```

### Rust
```rust
use sillycode::{parse, render};

let input = "[b]Hello[/b] [:)]";
let parts = parse(input);
let html = render(parts, false);

println!("{}", html);
```

## API Reference

### JavaScript/TypeScript

#### Core Functions
- `parse(input: string): Part[]` - Parse sillycode markup into structured parts
- `render(parts: Part[], isEditor?: boolean): string` - Render parts to HTML
- `length(parts: Part[]): number` - Calculate display length of parts

#### DOM Utilities
- `reverse($root: HTMLElement): string` - Extract sillycode markup from DOM elements
- `diff($expected: HTMLElement, $actual: HTMLElement): boolean` - Efficiently diff and update DOM trees

#### Types
- `Part` - Union type for all parsed parts (text, style, emote, color, etc.)
- `StyleKind` - Enum for style types (bold, italic, underline, etc.)
- `EmoteKind` - Enum for emote types (smile, sad, etc.)
- `Color` - Type alias for color strings

### Rust

#### Core Functions
- `parse(input: &str) -> Vec<Part>` - Parse sillycode markup into structured parts
- `render(parts: impl IntoIterator<Item = Part>, is_editor: bool) -> String` - Render parts to HTML
- `length(parts: &[Part]) -> usize` - Calculate display length of parts

#### Types
- `Part` - Enum for all parsed parts (text, style, emote, color, etc.)
- `StyleKind` - Enum for style types (bold, italic, underline, etc.)
- `EmoteKind` - Enum for emote types (smile, sad, etc.)
- `Color` - Type alias for color strings

## Authors
Made with ❤ by Lua ([foxgirl.dev](https://foxgirl.dev/)) :3c

## License
This project is licensed under [MIT](LICENSE).
More info in the [LICENSE](LICENSE) file.
