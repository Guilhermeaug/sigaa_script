import { load } from "cheerio";
import FormData from "form-data";
import { logger } from "./utils.js";

export const getClasses = async (scraper) => {
  const res = await scraper.http.get("verPortalDiscente.do");
  const $ = load(res.data);

  const courses = $("td.descricao")
    .toArray()
    .map((course) => {
      const formElement = $(course).find("form");
      const formName = formElement.attr("name");

      const aElement = $(course).find("a");
      const aElementOnClick = aElement.attr("onclick");

      const idRegex = /'frontEndIdTurma':'(.*)'/;
      const frontEndIdTurma = idRegex.exec(aElementOnClick)[0].split("'")[3];

      const formNameRegex = new RegExp(`${formName}:[a-zA-Z0-9_]+`);
      const courseVirtualAccessForm = formNameRegex.exec(aElementOnClick)[0];

      return {
        name: $(course).text().trim(),
        request: {
          [formName]: formName,
          [courseVirtualAccessForm]: courseVirtualAccessForm,
          frontEndIdTurma: frontEndIdTurma,
          "javax.faces.ViewState": scraper.findViewState($(course)),
        },
      };
    });

  logger.info("Classes found:", courses.length);

  return courses;
};

export const getGrades = async (scraper, courses) => {
  const fetchCoursePage = async (course) => {
    const courseUrl = `portais/discente/discente.jsf`;
    const form = new FormData();
    for (const key in course.request) {
      form.append(key, course.request[key]);
    }

    const responseCoursePage = await scraper.http.post(courseUrl, form);
    return responseCoursePage;
  };

  const fetchGradesPage = async (course) => {
    const responseCoursePage = await fetchCoursePage(course);
    const $coursePage = load(responseCoursePage.data);

    const formMenu = $coursePage("#formMenu");
    const formMenuName = formMenu.attr("name");
    const javaxFacesViewState = scraper.findViewState(formMenu);

    const sectionId = "formMenu:j_id_jsp_311393315_71";
    const studentsId = "formMenu:j_id_jsp_311393315_94";

    const seeGradesId = "formMenu:j_id_jsp_311393315_99";

    const gradesUrl = `ava/index.jsf`;
    const form2 = new FormData();
    const request = {
      [formMenuName]: formMenuName,
      [sectionId]: studentsId,
      [seeGradesId]: seeGradesId,
      "javax.faces.ViewState": javaxFacesViewState,
    };
    for (const key in request) {
      form2.append(key, request[key]);
    }

    const responseGradesPage = await scraper.http.post(gradesUrl, form2);
    return responseGradesPage;
  };

  const getCourseData = async (course) => {
    logger.info("Searching for course data", course.name);

    const responseGradesPage = await fetchGradesPage(course);
    const $gradesPage = load(responseGradesPage.data);

    if (!$gradesPage(".tabelaRelatorio").html()) {
      logger.error("No grades found for", course.name);
      return [];
    }
    logger.info("Found grades for", course.name);

    const assessments = [];

    const headers = $gradesPage('th[id^="aval_"]');
    headers.each((_, header) => {
      const id = $gradesPage(header).attr("id").split("_")[1];
      const name = $gradesPage(`#denAval_${id}`).val();
      const maxScore = parseFloat($gradesPage(`#notaAval_${id}`).val());
      const abbreviation = $gradesPage(`#abrevAval_${id}`).val();

      const score = parseFloat(
        $gradesPage("tbody tr:first-child")
          .find(`td:nth-child(${headers.index(header) + 3})`) // +3 to skip registration and name columns
          .text()
          .trim()
          .replace(",", ".")
      );

      if (name && !isNaN(maxScore) && !isNaN(score)) {
        assessments.push({
          name,
          abbreviation,
          maxScore,
          score,
        });
      }
    });

    return assessments;
  };

  const data = [];
  for await (const course of courses.slice(0, 1)) {
    const assessments = await getCourseData(course);
    data.push({
      course: course.name,
      assessments,
    });
  }
  return data;
};
