import { useEffect, useState } from 'react'

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from '@/next-i18next'

import CheckBox from '@/components/CheckBox'
import MarkdownExtended from '@/components/MarkdownExtended'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function IntroPage() {
  const { t } = useTranslation(['common', 'projects'])
  const { query, push } = useRouter()
  const { id, chapter, step } = query
  const [introMd, setIntroMd] = useState('')
  const [checked, setChecked] = useState(false)

  const [title, setTitle] = useState({})
  const [project, setProject] = useState(false)

  useEffect(() => {
    if (id) {
      const _project = window.electronAPI.getProject(id)
      if (_project && _project?.steps?.length <= parseInt(step)) {
        push(`/project/${id}`)
      } else {
        setProject(_project)
      }
    }
  }, [id])

  useEffect(() => {
    if (!project) {
      return
    }

    const stepsData = project.steps[step]
    setIntroMd(stepsData.intro)
    setTitle({ title: stepsData.title, subtitle: null })
  }, [chapter, project, step])

  const nextStepHandle = () => {
    push(`/account/project/${id}/${chapter}/${step}`)
    setChecked(false)
  }

  return (
    <div className="layout-appbar">
      <Head>
        <title>{t('V-CANA')}</title>
      </Head>

      <div className="f-screen-appbar mb-4 w-full max-w-3xl">
        <Breadcrumbs currentTitle={project?.book?.name} />

        <div
          style={{ height: 'calc(100vh - 11rem)' }}
          className="mb-4 mx-auto py-6 px-6 lg:px-8 bg-th-secondary-10 overflow-auto rounded-lg"
        >
          <h2 className="mb-4 text-3xl">{title.title}</h2>
          {title.subtitle && <h3 className="mb-4 text-xl">{title.subtitle}</h3>}

          <MarkdownExtended className="markdown-body">{introMd}</MarkdownExtended>

          <p className="mt-10 opacity-40 cursor-default">
            * {t('projects:DisableIntroClue')}
          </p>
        </div>

        <div className="flex items-center justify-end h-12 md:h-16 flex-row space-x-6">
          <CheckBox
            onChange={() => setChecked((prev) => !prev)}
            checked={checked}
            className={{
              accent:
                'bg-th-secondary-10 checked:bg-th-secondary-400 checked:border-th-secondary-400 checked:before:bg-th-secondary-400 border-th-secondary',
              cursor: 'fill-th-secondary-10 text-th-secondary-10 stroke-th-secondary-10',
            }}
            label={t('Ok')}
          />
          <button
            className="relative btn-quaternary w-28 text-center"
            onClick={nextStepHandle}
            disabled={!checked}
          >
            {project?.steps?.length === parseInt(step) + 1 ? t('Finish') : t('Next')}
          </button>
        </div>
      </div>
    </div>
  )
}
