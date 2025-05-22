/**
 * Fast and safe sillycode parsing and rendering library.
 *
 * This library provides functionality to parse sillycode markup into structured
 * parts and render them as HTML. For more information on the syntax, see the
 * [sillycode guide](https://sillypost.net/sillycode_guide).
 *
 * @example
 * ```typescript
 * import { parse, render } from 'sillycode';
 *
 * const input = "[b]Hello[/b] [:)]";
 * const parts = parse(input);
 * const html = render(parts, false);
 *
 * console.log(html);
 * ```
 */

export * from './parser.ts';
export * from './renderer.ts';
export * from './dom.ts';
