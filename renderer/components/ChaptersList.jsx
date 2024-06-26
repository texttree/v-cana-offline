import Link from "next/link";
import { useRouter } from "next/router";

import { JsonToPdf } from "@texttree/obs-format-convert-rcl";
import { useTranslation } from "react-i18next";

const styles = {
  currentPage: {
    fontSize: 16,
    alignment: "center",
    bold: true,
    margin: [0, 10, 0, 0],
  },
  chapterTitle: { fontSize: 20, bold: true, margin: [0, 26, 0, 15] },
  verseNumber: { sup: true, bold: true, opacity: 0.8, margin: [0, 8, 8, 0] },
  defaultPageHeader: { bold: true, width: "50%" },
  text: { alignment: "justify" },
};

function ChapterList({ id, chapters, steps, mutate }) {
  const {
    i18n: { language: locale },
    t,
  } = useTranslation(["projects", "common"]);
  const { pathname } = useRouter();

  const handleBackStep = (chapter, step) => {
    const backStep = window.electronAPI.goToStep(id, chapter, step - 1);
    if (backStep !== step) {
      mutate();
    }
  };
  const handleDownloadChapter = (chapter) => {
    const savedVerses = Object.entries(
      window.electronAPI.getChapter(id, chapter)
    )
      .map(([k, v]) => ({ verse: k, text: v.text, enabled: v.enabled }))
      .filter((v) => v.enabled);
    const filename = "chapter_" + chapter;
    JsonToPdf({
      data: [{ title: "Chapter " + chapter, verseObjects: savedVerses }],
      styles,
      filename,
      showImages: false,
      combineVerses: false,
      showChapterTitlePage: false,
      showVerseNumber: true,
      bookPropertiesObs: {},
      showPageFooters: false,
    })
      .then(() => console.log("PDF creation completed"))
      .catch((error) => console.error("PDF creation failed:", error));
  };
  return (
    <table className="border-collapse table-auto w-full text-sm">
      <thead>
        <tr>
          <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 text-left">
            {t("Chapter")}
          </th>
          <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 text-left">
            {t("Step")}
          </th>
          <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 text-left">
            {t("StepBack")}
          </th>
          <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 text-left">
            {t("common:Download")}
          </th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {chapters.map(([chapter, step]) => (
          <tr key={chapter}>
            <td className="border-b border-slate-100 p-4 pl-8 text-slate-500">
              <Link
                href={`${pathname
                  .replace("[locale]", locale)
                  .replace("[id]", id)}/${chapter}/${step}`}
                legacyBehavior
              >
                <a className="font-bold underline">
                  {t("Chapter")} {chapter}
                </a>
              </Link>
            </td>
            <td className="border-b border-slate-100 p-4 pl-8 text-slate-500">
              {steps[step].title} | {steps[step].intro}
            </td>
            <td className="border-b border-slate-100 p-4 pl-8 text-slate-500">
              {step > 0 && (
                <div
                  className="btn-primary text-base"
                  onClick={() => handleBackStep(chapter, step)}
                >
                  {t("GoToStep")} {step}
                </div>
              )}
            </td>
            <td className="border-b border-slate-100 p-4 pl-8 text-slate-500">
              <div
                className="btn-primary text-base"
                onClick={() => handleDownloadChapter(chapter)}
              >
                {t("common:Download")}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ChapterList;
