package main

import (
	"testing"
)

// TestValidateNoteID tests note ID validation
func TestValidateNoteID(t *testing.T) {
	tests := []struct {
		id    string
		valid bool
	}{
		{"ACE23", true},
		{"BLAST47", true},
		{"ZEBRA99", true},
		{"123", false}, // Contains 1
		{"a", false},   // Lowercase
		{"", false},    // Empty
		{"abc-def", false},
		{"abc_def", false},
		{"abc@def", false},
		{"abc def", false},
		{"abc.def", false},
		{"../etc", false},
		{"ABCDEFGHJKLMNPQRSTUVWXYZ23456789", true}, // 32 chars
		{"ABCDEFGHJKLMNPQRSTUVWXYZ23456789A", false}, // 33 chars
	}

	for _, test := range tests {
		result := ValidateNoteID(test.id)
		if result != test.valid {
			t.Errorf("ValidateNoteID(%s) = %v, expected %v", test.id, result, test.valid)
		}
	}
}

// TestGenerateNoteID tests note ID generation
func TestGenerateNoteID(t *testing.T) {
	tests := 100

	for i := 0; i < tests; i++ {
		id := GenerateNoteID()

		// Check valid length
		if len(id) < 5 || len(id) > 7 {
			t.Errorf("Generated ID has length %d, expected 5-7", len(id))
		}

		// Check it's valid
		if !ValidateNoteID(id) {
			t.Errorf("Generated ID %s is not valid", id)
		}
	}
}

// TestEscapeHTML tests HTML escaping
func TestEscapeHTML(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"<script>alert('xss')</script>", "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"},
		{"<div>test</div>", "&lt;div&gt;test&lt;/div&gt;"},
		{"normal text", "normal text"},
		{"test & test", "test &amp; test"},
		{"\"quoted\"", "&#34;quoted&#34;"},
		{"'quoted'", "&#39;quoted&#39;"},
		{"", ""},
	}

	for _, test := range tests {
		result := EscapeHTML(test.input)
		if result != test.expected {
			t.Errorf("EscapeHTML(%s) = %s, expected %s", test.input, result, test.expected)
		}
	}
}
