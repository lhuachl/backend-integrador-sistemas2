package service

import (
	"regexp"
	"strings"
)

var wikiLinkRegex = regexp.MustCompile(`\[\[([^\[\]]+?)\]\]`)

// ponytail: single-pass regex extraction, O(n) per note.
// Upgrade path: use a tokenizer if 100k-note documents appear.
func ExtractWikiLinks(content string) []string {
	matches := wikiLinkRegex.FindAllStringSubmatch(content, -1)
	seen := map[string]bool{}
	out := make([]string, 0, len(matches))
	for _, m := range matches {
		title := strings.TrimSpace(m[1])
		if title == "" || seen[title] {
			continue
		}
		seen[title] = true
		out = append(out, title)
	}
	return out
}
