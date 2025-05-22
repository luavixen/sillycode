
/**
 * generates sillycode markup from the children of a DOM element
 */
export function reverse($root: HTMLElement): string {
  var lines: string[] = [];

  for (var $child = $root.firstChild; $child != null; $child = $child.nextSibling) {
    var text = $child.textContent || '';

    // replace all nbsp with spaces
    text = text.replace(/\u00A0/g, ' ');

    if ($child.nodeType === Node.TEXT_NODE) {
      if (lines.length > 0) {
        lines[lines.length - 1] += text;
      } else {
        lines.push(text);
      }
    } else if ($child.nodeType === Node.ELEMENT_NODE) {
      lines.push(text);
    }
  }

  return lines.join('\n');
}


/** converts an array-like object to an array */
function toArray<T>(value: { length: number, [index: number]: T }): T[] {
  return Array.prototype.slice.call(value);
}

/** creates an iterator over the siblings of a DOM element */
function createSiblingIterator($next: Node | null): () => Node | null {
  return function () {
    if ($next == null) return null;
    var $prev = $next;
    $next = $next.nextSibling;
    return $prev;
  };
}


/**
 * diffs two DOM elements' children, returning true if any changes were made
 */
export function diff($expectedRoot: HTMLElement, $actualRoot: HTMLElement): boolean {
  // have we made any changes?
  var dirty = false;

  // diff the children of two elements
  function diffChildren($expected: HTMLElement, $actual: HTMLElement): void {
    // iterate over the children
    var expectedChildren = createSiblingIterator($expected.firstChild);
    var actualChildren = createSiblingIterator($actual.firstChild);

    for (;;) {
      var $expectedChild = expectedChildren();
      var $actualChild = actualChildren();

      // if there are no more children, we are done
      if ($expectedChild == null && $actualChild == null) break;

      // if the expected child is null, remove the actual child
      if ($expectedChild == null) {
        $actual.removeChild($actualChild!);
        dirty = true;
        continue;
      }

      // if the actual child is null, add the expected child
      if ($actualChild == null) {
        $actual.appendChild($expectedChild.cloneNode(true));
        dirty = true;
        continue;
      }

      // if the types don't match, replace the actual child with a clone of the expected child
      if ($expectedChild.nodeType !== $actualChild.nodeType) {
        $actual.replaceChild($expectedChild.cloneNode(true), $actualChild);
        dirty = true;
        continue;
      }

      // if the actual child is a text node, update the text content
      if ($expectedChild.nodeType === Node.TEXT_NODE) {
        if ($actualChild.textContent !== $expectedChild.textContent) {
          $actualChild.textContent = $expectedChild.textContent;
          dirty = true;
        }
        continue;
      }

      // if the expected child is an element node, recursively diff the children
      if ($expectedChild.nodeType === Node.ELEMENT_NODE) {
        diffElement($expectedChild as HTMLElement, $actualChild as HTMLElement);
        continue;
      }
    }
  }

  // diff the tag, attributes, and children of two elements,
  // replacing the actual element in the DOM if necessary
  function diffElement($expected: HTMLElement, $actual: HTMLElement): void {
    // re-create the actual node if the tag names don't match
    if ($expected.tagName !== $actual.tagName) {
      var $oldActual = $actual;
      var $newActual = document.createElement($expected.tagName);

      // copy the old node's children
      var $child;
      while ($child = $oldActual.firstChild) {
        $newActual.appendChild($child);
      }

      // replace the old node with the new one in the DOM
      var $parent = $oldActual.parentNode;
      if ($parent) {
        $parent.replaceChild($newActual, $oldActual);
      }

      $actual = $newActual;

      dirty = true;
    }

    // update the attributes
    toArray($expected.attributes).forEach(function (attr) {
      if ($actual.getAttribute(attr.name) !== attr.value) {
        $actual.setAttribute(attr.name, attr.value);
        dirty = true;
      }
    });

    // remove the attributes that are no longer present
    toArray($actual.attributes).forEach(function (attr) {
      if (!$expected.hasAttribute(attr.name)) {
        $actual.removeAttribute(attr.name);
        dirty = true;
      }
    });

    // diff the children of two elements
    diffChildren($expected, $actual);
  }

  // diff the root element's children
  diffChildren($expectedRoot, $actualRoot);

  // we are done :3
  return dirty;
}
