import { Request, Response } from "express";

import { loginService } from "./auth.service";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    const data = await loginService(username, password);

    res.json(data);
  } catch (err: any) {
    res.status(401).json({
      message: err.message,
    });
  }
}
