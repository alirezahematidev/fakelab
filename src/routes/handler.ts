import express from "express";
import type { Builder } from "../types";
import type { Network } from "../network";
import type { Database } from "../database";
import type { Config } from "../config/conf";

class RouteHandler {
  private readonly SEED_MERGE_THRESHOLD = 1000;

  constructor(private readonly builder: Builder, private readonly network: Network, private readonly database: Database, private readonly config: Config) {}

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  // returns true if need to block
  private async applyNetworkHandlers(res: express.Response) {
    if (this.network.offline()) {
      const { status, message } = this.network.state("offline");
      res.status(status).json({ message });
      return true;
    }

    // sleep
    await this.network.wait();

    if (this.network.timeout()) {
      return true;
    }

    if (this.network.error()) {
      const { status, message } = this.network.state("error");
      res.status(status).json({ message });
      return true;
    }
    return false;
  }

  entity() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (await this.applyNetworkHandlers(res)) return;

        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.build(name.toLowerCase(), entity.type, queries);

          res.status(200).json(data);
        } else {
          res.status(400).json({ message: "The entity is not exists" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  getTable() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        if (await this.applyNetworkHandlers(res)) return;

        const name = req.params.name;

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          await entity.table.read();
          res.status(200).json(entity.table.data);
        } else {
          res.status(400).json({ message: `${name} table is not exists` });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  updateTable() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        if (await this.applyNetworkHandlers(res)) return;

        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.build(name.toLowerCase(), entity.type, queries);

          await entity.table.update((items) => items.push(...(Array.isArray(data) ? data : [data])));
          res.status(200).json({ success: true });
        } else {
          res.status(400).json({ success: false, message: `${name} table is not exists` });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  insert() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        const count = req.body?.count || 1;
        const strategy = req.body?.strategy || "reset";

        const name = req.params.name;

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.build(name.toLowerCase(), entity.type, { count });

          await entity.table.read();

          if (strategy === "once" && entity.table.data.length > 0) {
            return res.status(200).json({ message: `${name} entity was seeded once before.` });
          }

          await entity.table.update((items) => {
            if (strategy !== "merge") {
              items.length = 0;
            }

            const insertee = Array.isArray(data) ? data : [data];

            if (items.length + insertee.length < this.SEED_MERGE_THRESHOLD) {
              items.push(...insertee);
            }
          });

          res.status(200).json({ success: true });
        } else {
          res.status(400).json({ success: false, message: "The table is not exists" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  flush() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        const name = req.params.name;

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          await entity.table.update((items) => (items.length = 0));

          res.status(200).json({ success: true });
        } else {
          res.status(400).json({ success: false, message: "The table is not exists" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  // private
  _update() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.build(name.toLowerCase(), entity.type, queries);

          await entity.table.update((items) => items.push(data));
          res.status(301).redirect(`/database/${name.toLowerCase()}`);
        } else {
          res.status(400).redirect("/database");
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        res.status(500).redirect("/database");
      }
    };
  }

  _clear() {
    return async (req: express.Request, res: express.Response) => {
      if (!this.config.enabled()) {
        return res.status(500).json({ error: "Fakelab is disabled." });
      }

      try {
        if (!this.database.enabled()) return res.status(403).json({ message: "database is not enabled or initialized." });

        const name = req.params.name;

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          await entity.table.read();

          if (entity.table.data.length > 0) {
            await entity.table.update((items) => (items.length = 0));
          }
          res.status(301).redirect(`/database/${name.toLowerCase()}`);
        } else {
          res.status(400).redirect("/database");
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        res.status(500).redirect("/database");
      }
    };
  }
}

export { RouteHandler };
