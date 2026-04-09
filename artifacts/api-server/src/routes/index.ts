import { Router } from "express";
import healthRouter from "./health.js";
import whatsappRouter from "./whatsapp.js";
import sendRouter from "./send.js";
import uiRouter from "./ui.js";

const router = Router();

router.use(healthRouter);
router.use(whatsappRouter);
router.use(sendRouter);
router.use(uiRouter);

export default router;
