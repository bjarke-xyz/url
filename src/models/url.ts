import { LibsqlDialect } from "@libsql/kysely-libsql";
import { formatISO } from "date-fns";
import { Kysely } from "kysely";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdef", 10);

interface Url {
  id?: number;
  urlKey: string;
  url: string;
  createdAt: string;
  createdByIp?: string;
  visits: number;
  lastVisitedAt?: string;
}

interface Database {
  urls: Url;
}

export interface LibsqlConnectionInfo {
  url: string;
  authToken: string;
}

export class UrlRepository {
  private readonly db: Kysely<Database>;
  constructor(connInfo: LibsqlConnectionInfo) {
    this.db = new Kysely<Database>({
      dialect: new LibsqlDialect({
        url: connInfo.url,
        authToken: connInfo.authToken,
      }),
    });
  }

  public async getUrl(key: string): Promise<Url | null> {
    return (
      (await this.db
        .selectFrom("urls")
        .selectAll()
        .where("urlKey", "=", key)
        .executeTakeFirst()) ?? null
    );
  }

  public async setUrl(url: Url): Promise<void> {
    await this.db.insertInto("urls").values(url).execute();
  }

  public async incrementVisits(key: string): Promise<void> {
    await this.db
      .updateTable("urls")
      .set((eb) => ({
        lastVisitedAt: formatISO(new Date()),
        visits: eb.eb("visits", "+", 1),
      }))
      .where("urlKey", "=", key)
      .execute();
  }

  public async isKeyUnique(key: string): Promise<boolean> {
    const dbId = await this.db
      .selectFrom("urls")
      .select("id")
      .where("urlKey", "=", key)
      .executeTakeFirst();
    if (dbId?.id) {
      return false;
    } else {
      return true;
    }
  }

  public async getUniqueKey(): Promise<string> {
    let key = nanoid(7);
    const maxAttempts = 5000;
    let attempt = 0;
    while (true) {
      key = nanoid(7);
      const isUnique = await this.isKeyUnique(key);
      attempt++;
      if (isUnique || attempt > maxAttempts) {
        break;
      }
    }
    return key;
  }
}
