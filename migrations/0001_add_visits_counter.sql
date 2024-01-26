-- Migration number: 0001 	 2024-01-26T18:12:35.949Z
ALTER TABLE
    urls
ADD
    COLUMN visits INTEGER DEFAULT 0;

ALTER TABLE
    urls
ADD
    COLUMN lastVisitedAt TEXT;