import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./_core/app";

let appInstance: any;

const getApp = async () => {
  if (!appInstance) {
    appInstance = await createApp();
  }
  return appInstance;
};

export const api = onRequest(
  {
    region: "europe-west1",
    maxInstances: 10,
  },
  async (req, res) => {
    const app = await getApp();
    app(req, res);
  }
);
