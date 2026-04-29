import { Router } from "express";
import userRoute from "../user/user.route";
import deviceRoutes from "../device/device.route";

const router = Router();

router.use("/users", userRoute);
router.use("/devices", deviceRoutes);

export default router;
