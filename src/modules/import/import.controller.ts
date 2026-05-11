import { Request, Response } from "express";

import { importUsersFromExcel } from "./import.service";

export async function importUsersController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File required",
      });
    }

    const result = await importUsersFromExcel(req.file.path);

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Import failed",
    });
  }
}
