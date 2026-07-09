package main

import (
	"crypto/rand"
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"time"

	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

//go:embed schema.sql
var schema string

const (
	keyAlphabet = "0123456789abcdef"
	keyLength   = 7
)

var (
	ErrKeyTaken = errors.New("key already exists")
	ErrNotFound = errors.New("url not found")
)

type Url struct {
	Key           string
	URL           string
	CreatedAt     string
	CreatedByIP   string
	Visits        int64
	LastVisitedAt string
}

type Store struct {
	db *sql.DB
}

// The rollback journal is deliberate, not an oversight: sqlite-backer-upper
// backs this db up over a read-only bind mount, and a WAL database cannot be
// opened at all without write access for its -shm file, even with no writers.
func OpenStore(path string) (*Store, error) {
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(delete)&_pragma=busy_timeout(5000)", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) Get(key string) (*Url, error) {
	var (
		u             Url
		url           sql.NullString
		createdByIP   sql.NullString
		visits        sql.NullInt64
		lastVisitedAt sql.NullString
	)
	err := s.db.QueryRow(
		`SELECT urlKey, url, createdAt, createdByIp, visits, lastVisitedAt
		 FROM urls WHERE urlKey = ?`, key,
	).Scan(&u.Key, &url, &u.CreatedAt, &createdByIP, &visits, &lastVisitedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.URL = url.String
	u.CreatedByIP = createdByIP.String
	u.Visits = visits.Int64
	u.LastVisitedAt = lastVisitedAt.String
	return &u, nil
}

// Create inserts a url, returning ErrKeyTaken if the key is already in use.
func (s *Store) Create(u Url) error {
	_, err := s.db.Exec(
		`INSERT INTO urls (urlKey, url, createdAt, createdByIp, visits)
		 VALUES (?, ?, ?, ?, 0)`,
		u.Key, u.URL, u.CreatedAt, nullString(u.CreatedByIP),
	)
	var serr *sqlite.Error
	if errors.As(err, &serr) && serr.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE {
		return ErrKeyTaken
	}
	return err
}

// CreateWithGeneratedKey inserts a url under a random key, retrying on collision.
func (s *Store) CreateWithGeneratedKey(u Url) (string, error) {
	for range 5 {
		key, err := generateKey()
		if err != nil {
			return "", err
		}
		u.Key = key
		switch err := s.Create(u); {
		case err == nil:
			return key, nil
		case errors.Is(err, ErrKeyTaken):
			continue
		default:
			return "", err
		}
	}
	return "", errors.New("could not generate an unused key")
}

// Redirect counts a visit and returns the target url in a single statement.
func (s *Store) Redirect(key string) (string, error) {
	var url sql.NullString
	err := s.db.QueryRow(
		// COALESCE guards rows created before the visits column existed.
		`UPDATE urls SET visits = COALESCE(visits, 0) + 1, lastVisitedAt = ?
		 WHERE urlKey = ? RETURNING url`,
		time.Now().Format(time.RFC3339), key,
	).Scan(&url)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && !url.Valid) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return url.String, nil
}

func generateKey() (string, error) {
	b := make([]byte, keyLength)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	// len(keyAlphabet) is 16, a power of two, so masking is unbiased.
	for i, c := range b {
		b[i] = keyAlphabet[c&0x0f]
	}
	return string(b), nil
}

func nullString(s string) any {
	if s == "" {
		return nil
	}
	return s
}
