package main

import (
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"time"
)

// reservedKeys collide with literal routes, so a short link using one would
// never resolve.
var reservedKeys = map[string]bool{"new": true, "view": true}

type server struct {
	store   *Store
	baseURL string
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", s.index)
	mux.HandleFunc("GET /new", s.newForm)
	mux.HandleFunc("POST /new", s.create)
	mux.HandleFunc("GET /view", s.view)
	mux.HandleFunc("GET /{key}", s.redirect)
	return logRequests(mux)
}

func (s *server) index(w http.ResponseWriter, r *http.Request) {
	render(w, "index", "", nil)
}

func (s *server) newForm(w http.ResponseWriter, r *http.Request) {
	render(w, "new", "New", r.URL.Query().Get("err"))
}

func (s *server) create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		formError(w, r, "invalid form")
		return
	}

	target := r.PostFormValue("url")
	if target == "" {
		formError(w, r, "no url provided")
		return
	}
	if !isRedirectable(target) {
		formError(w, r, "invalid url")
		return
	}

	entry := Url{
		URL:         target,
		CreatedAt:   time.Now().Format(time.RFC3339),
		CreatedByIP: clientIP(r),
	}

	key := r.PostFormValue("key")
	if key == "" {
		generated, err := s.store.CreateWithGeneratedKey(entry)
		if err != nil {
			slog.Error("create failed", "err", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		key = generated
	} else {
		if reservedKeys[key] {
			formError(w, r, "invalid key")
			return
		}
		entry.Key = key
		switch err := s.store.Create(entry); {
		case errors.Is(err, ErrKeyTaken):
			formError(w, r, "key already exists")
			return
		case err != nil:
			slog.Error("create failed", "err", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}

	http.Redirect(w, r, "/view?key="+url.QueryEscape(key), http.StatusFound)
}

func (s *server) view(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	data := viewData{Key: key, Searched: key != ""}

	if data.Searched {
		entry, err := s.store.Get(key)
		switch {
		case errors.Is(err, ErrNotFound):
		case err != nil:
			slog.Error("lookup failed", "key", key, "err", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		default:
			data.Found = entry.URL != ""
			data.URL = entry.URL
			data.Visits = entry.Visits
			data.LastVisitedAt = entry.LastVisitedAt
		}
		data.ShortURL = s.resolveBaseURL(r) + "/" + key
	}

	render(w, "view", orDefault(key, "View"), data)
}

func (s *server) redirect(w http.ResponseWriter, r *http.Request) {
	target, err := s.store.Redirect(r.PathValue("key"))
	if err != nil {
		if !errors.Is(err, ErrNotFound) {
			slog.Error("redirect failed", "err", err)
		}
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	// Rows predating scheme validation, e.g. imported from the old Turso
	// database, may hold a javascript: url.
	if !isRedirectable(target) {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	http.Redirect(w, r, target, http.StatusFound)
}

// isRedirectable rejects schemes such as javascript: that must never reach an
// href or a Location header.
func isRedirectable(target string) bool {
	u, err := url.Parse(target)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

type viewData struct {
	Key, URL, ShortURL, LastVisitedAt string
	Searched, Found                   bool
	Visits                            int64
}

func formError(w http.ResponseWriter, r *http.Request, msg string) {
	http.Redirect(w, r, "/new?err="+url.QueryEscape(msg), http.StatusFound)
}

// resolveBaseURL prefers the configured BASE_URL, falling back to the request's
// own host and the proxy's forwarded scheme.
func (s *server) resolveBaseURL(r *http.Request) string {
	if s.baseURL != "" {
		return s.baseURL
	}
	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
		if r.TLS != nil {
			scheme = "https"
		}
	}
	return scheme + "://" + r.Host
}

func clientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	return r.Header.Get("CF-Connecting-IP")
}

func orDefault(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		slog.Info(r.Method+" "+r.URL.Path,
			"status", rec.status, "duration", time.Since(start))
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}
