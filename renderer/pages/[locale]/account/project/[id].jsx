import React, { useEffect, useState } from "react";

import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import Breadcrumbs from "../../../../components/Breadcrumbs";
import ChapterList from "../../../../components/ChaptersList";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function Project() {
  const { t } = useTranslation(["common", "projects"]);
  const {
    query: { id },
  } = useRouter();

  const [project, setProject] = useState(false);

  const mutate = () => {
    setProject(window.electronAPI.getProject(id));
  };

  useEffect(() => {
    if (id) {
      setProject(window.electronAPI.getProject(id));
      window.electronAPI.setProjectFolder(id);
    }
  }, [id]);

  return (
    <>
      <Head>
        <title>{t("V-CANA")}</title>
      </Head>
      <div className="w-full">
        <Breadcrumbs currentTitle={project?.book?.name} />
        {/* <Link href={`/project/${id}/settings`}>
          <a>Settings</a>
        </Link> */}
        <h2 className="mt-6 mb-6 text-4xl">{t("projects:Chapters")}</h2>
        {project ? (
          <ChapterList
            id={id}
            steps={project.steps}
            chapters={Object.entries(project.chapters)}
            mutate={mutate}
          />
        ) : (
          <>{t("Loading")}</>
        )}
        <br />
        {/* <pre>{JSON.stringify(project, null, 2)}</pre> */}
      </div>
    </>
  );
}

export default Project;

export async function getStaticProps({ params }) {
  const { locale } = params;

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "projects"])),
    },
  };
}

export async function getStaticPaths() {
  const paths = [
    { params: { locale: "en", id: "1" } },
    { params: { locale: "es", id: "2" } },
    { params: { locale: "ru", id: "3" } },
  ];

  return { paths, fallback: "blocking" };
}
