import axios from "axios";
import { logger } from "./utils.js";

const BASE_URL = "https://sig.cefetmg.br/sigaa/";
const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
};

export class Scraper {
  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      headers: HEADERS,
      withCredentials: true,
    });
    this.hasSetup = false;
  }

  async setup() {
    try {
      await this.getJsessionId("verTelaLogin.do");
      await this.login(
        "logar.do?dispatch=logOn",
        process.env.USUARIO,
        process.env.SENHA
      );
      this.hasSetup = true;
    } catch (error) {
      logger.error("Failed to SETUP", error);
    }
  }

  async scrape() {
    try {
      if (!this.hasSetup) {
        await this.setup();
      }
      return this;
    } catch (error) {
      logger.error("Failed to SCRAPE", error);
    }
  }

  async getJsessionId(url) {
    const response = await this.http.get(url);
    this.http.defaults.headers.cookie = response.headers["set-cookie"];
    logger.info("Saved JSESSIONID");
  }

  async login(url, user, password) {
    const form = new FormData();
    form.append("user.login", user);
    form.append("user.senha", password);

    await this.http.post(url, form);
    logger.info("Logged in");
  }

  findViewState(element) {
    return element.find('input[name="javax.faces.ViewState"]').val();
  }
}
