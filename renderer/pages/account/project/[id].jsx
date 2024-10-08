import { useEffect, useState } from 'react'

import Head from 'next/head'
import { useRouter } from 'next/router'

import ChapterList from '@/components/ChaptersList'
import { useTranslation } from '@/next-i18next'

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
        <title>{t('LEVEL')}</title>
      </Head>
      <div className="mx-auto mb-10 max-w-xs py-4 md:max-w-2xl xl:max-w-5xl 2xl:max-w-7xl">
        {project ? (
          <ChapterList
            id={id}
            steps={project.steps}
            chapters={Object.entries(project.chapters)}
            mutate={mutate}
            book={project.book}
            project={project}
          />
        ) : (
          <>{t('Loading')}</>
        )}
      </div>
    </>
  )
}

export default Project
