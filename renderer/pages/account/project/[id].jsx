import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from '@/next-i18next'

import Breadcrumbs from '@/components/Breadcrumbs'
import ChapterList from '@/components/ChaptersList'

function Project() {
  const { t } = useTranslation(['common', 'projects'])
  const {
    query: { id },
  } = useRouter()

  const [project, setProject] = useState(false)

  const mutate = () => {
    setProject(window.electronAPI.getProject(id))
  }

  useEffect(() => {
    if (id) {
      setProject(window.electronAPI.getProject(id))
      window.electronAPI.setProjectFolder(id)
    }
  }, [id])

  return (
    <>
      <Head>
        <title>{t('V-CANA')}</title>
      </Head>
      <div className="w-full">
        <Breadcrumbs currentTitle={project?.book?.name} />
        <h2 className="my-6 text-4xl">{t('projects:Chapters')}</h2>
        {project ? (
          <ChapterList
            id={id}
            steps={project.steps}
            chapters={Object.entries(project.chapters)}
            mutate={mutate}
          />
        ) : (
          <>{t('Loading')}</>
        )}
      </div>
    </>
  )
}

export default Project
