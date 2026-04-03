import { Router, type IRouter } from "express";
import healthRouter from "./health";
import whatsappRouter from "./whatsapp";
import sendRouter from "./send";
import uiRouter from "./ui";

const router: IRouter = Router();

router.use(healthRouter);
router.use(whatsappRouter);
router.use(sendRouter);
router.use(uiRouter);

export default router;
