import axios from "axios";
import chalk from "chalk";
import { load } from "cheerio";
import equal from "deep-equal";
import { config } from "dotenv";
import FormData from "form-data";
import { cache } from "./cache.js";
import { sendWebhook } from "./webhook.js";

config();
const BASE_URL = "https://sig.cefetmg.br/sigaa/";

const log = (...args) => {
  const date = new Date();
  const timestamp = date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  console.log(`[${timestamp}]`, ...args);
};

const getJsessionId = async (http) => {
  const url = `verTelaLogin.do`;
  const response = await http.get(url);
  http.defaults.headers.cookie = response.headers["set-cookie"];
  log(chalk.green("Got JSESSIONID"));
};

const login = async (http) => {
  const url = `logar.do?dispatch=logOn`;
  const form = new FormData();
  form.append("user.login", process.env.USUARIO);
  form.append("user.senha", process.env.SENHA);
  await http.post(url, form);
  log(chalk.green("Logged in"));
};

const getClasses = async (http) => {
  const homeUrl = `verPortalDiscente.do`;
  const response = await http.get(homeUrl);
  const $ = load(response.data);
  const courses = $("td.descricao")
    .toArray()
    .map((course) => {
      const onClick = $(course).find("a").attr("onclick");
      const name = $(course).text().trim();
      const action = $(course).find("form").attr("name");
      const formName = $(course).find("form:first-child").attr("name");

      const idRegex = /'frontEndIdTurma':'(.*)'/;
      const id = idRegex.exec(onClick)[0].split("'")[3];

      const regex2 = new RegExp(`${formName}:[a-zA-Z0-9_]+`);
      const m = regex2.exec(onClick)[0];
      return {
        name: name,
        request: {
          action: action,
          frontEndIdTurma: id,
          viewState: $(course)
            .find('input[name="javax.faces.ViewState"]')
            .val(),
          formName: formName,
          m: m,
        },
      };
    });

  log(chalk.green("Got classes"));

  return courses;
};

const getGrades = async (http, courses) => {
  for (const course of courses) {
    log(chalk.blue("Looking for "), course.name);

    const courseUrl = `portais/discente/discente.jsf`;
    const form = new FormData();
    form.append(course.request.formName, course.request.formName);
    form.append("javax.faces.ViewState", course.request.viewState);
    form.append(course.request.m, course.request.m);
    form.append("frontEndIdTurma", course.request.frontEndIdTurma);
    const responseCoursePage = await http.post(courseUrl, form);

    const $ = load(responseCoursePage.data);
    const form2 = new FormData();
    form2.append("formMenu", "formMenu");
    form2.append(
      "formMenu:j_id_jsp_311393315_71",
      "formMenu:j_id_jsp_311393315_94"
    );
    form2.append(
      "javax.faces.ViewState",
      $('input[name="javax.faces.ViewState"]').val()
    );
    form2.append(
      "formMenu:j_id_jsp_311393315_99",
      "formMenu:j_id_jsp_311393315_99"
    );
    const gradesUrl = `ava/index.jsf`;
    const responseGradesPage = await http.post(gradesUrl, form2);

    const $$ = load(responseGradesPage.data);
    if (!$$(".tabelaRelatorio").html()) {
      log(chalk.red("Não há notas disponíveis"));
      continue;
    }
    const p = $$(".tabelaRelatorio tbody tr td")
      .map((i, el) => {
        return $$(el).text().trim();
      })
      .get();
    // create a sublist, removing the first 2 elements and last 4 elements
    const points = p.slice(2, -4);
    const l = $$("tr#trAval")
      .find("th")
      .map((i, el) => {
        return $$(el).text().trim();
      })
      .get();
    const labels = l.slice(2, -4);

    const gradesMap = {};
    for (let i = 0; i < labels.length; i++) {
      gradesMap[labels[i]] = points[i];
    }

    const previousGrades = await cache.get(course.name);
    if (!equal(previousGrades, gradesMap)) {
      log(chalk.green("New grades for "), course.name);
      await cache.set(course.name, gradesMap);
      await sendWebhook(course.name, gradesMap);
    } else {
      log(chalk.red("No new grades for "), course.name);
    }
  }

  log(chalk.green("Finished executing"));
};

log("Starting Service");
const run = async () => {
  const http = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    },
  });

  await getJsessionId(http);
  await login(http);
  const courses = await getClasses(http);
  await getGrades(http, courses);
};
await run();

setInterval(async () => {
  await run();
}, 1000 * 60 * 5);
