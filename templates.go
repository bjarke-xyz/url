package main

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
)

//go:embed templates
var templateFS embed.FS

const baseTitle = "Url"

var pages = map[string]*template.Template{}

func init() {
	for _, name := range []string{"index", "new", "view"} {
		pages[name] = template.Must(template.ParseFS(templateFS,
			"templates/layout.html", "templates/"+name+".html"))
	}
}

// render writes a page wrapped in the layout, buffering so a template error
// cannot leave a half-written response behind.
func render(w http.ResponseWriter, name, title string, data any) {
	if title != "" {
		title = fmt.Sprintf("%s | %s", title, baseTitle)
	} else {
		title = baseTitle
	}

	var buf bytes.Buffer
	err := pages[name].ExecuteTemplate(&buf, "layout", struct {
		Title string
		Data  any
	}{title, data})
	if err != nil {
		slog.Error("render failed", "page", name, "err", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	buf.WriteTo(w)
}
