import express from "express";
import type { IGenerated } from "../types";

class RouteHandler {
  constructor(private readonly builder: IGenerated) {}

  private async handleQueries(request: express.Request) {
    const count = request.query.count;

    if (count) return { count: count.toString() };

    return {};
  }

  entity() {
    return async (req: express.Request, res: express.Response) => {
      try {
        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.forge(entity.type, queries);

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
      try {
        const name = req.params.name;

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          await entity.table.read();
          res.status(200).json(entity.table.data);
        } else {
          res.status(400).json({ message: "The table is not exists" });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    };
  }

  updateTable(isPrivate = false) {
    return async (req: express.Request, res: express.Response) => {
      try {
        const name = req.params.name;

        const queries = await this.handleQueries(req);

        const entity = this.builder.entities.get(name.toLowerCase());

        if (entity) {
          const { data } = await this.builder.forge(entity.type, queries);

          await entity.table.update((items) => items.push(data));
          if (isPrivate) res.status(301).redirect(`/database/${name.toLowerCase()}`);
          else res.status(200).json({ success: true });
        } else {
          if (isPrivate) res.status(400).redirect("/database");
          else res.status(400).json({ success: false, message: "The table is not exists" });
        }
      } catch (error) {
        if (isPrivate) res.status(500).redirect("/database");
        else res.status(500).send(error);
      }
    };
  }

  clearTable() {
    return async (req: express.Request, res: express.Response) => {
      try {
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
      } catch (error) {
        res.status(500).redirect("/database");
      }
    };
  }
}

export { RouteHandler };
