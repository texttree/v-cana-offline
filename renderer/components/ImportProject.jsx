import { useState } from 'react'

import Link from 'next/link'

import { useTranslation } from '@/next-i18next'
import Left from 'public/icons/left.svg'
import toast from 'react-hot-toast'

function ImportProject() {
  const { t } = useTranslation(['common', 'projects'])
  const [fileUrl, setFileUrl] = useState(false)
  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await window.electronAPI.addProject(fileUrl)
      toast.success(t('projects:SuccessfullyAddedProject'))
    } catch (error) {
      console.error('Failed to add project:', error)
      toast.error(t('projects:FailedAddProject'))
    }
  }

  return (
    <>
      <div className="h-7 rounded-t-lg bg-th-primary-100"></div>
      <div className="flex h-16 items-center border-b border-th-secondary-200 bg-th-secondary-10 text-lg">
        <Link className="flex items-center pl-8" href="/account">
          <Left className="w-6 stroke-th-secondary-300" />
          <span className="ml-2.5 text-sm text-th-secondary-300">
            {t('common:Projects')}
          </span>
        </Link>
        <span className="ml-6 inline text-lg font-bold">{t('common:Import')}</span>
      </div>
      <div className="flex items-center rounded-b-lg border-b border-th-secondary-200 bg-th-secondary-10 px-8 py-8 text-lg">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4">
            <button
              className="btn-primary mt-3 w-fit text-base"
              onClick={async (e) => {
                e.preventDefault()
                const filePath = await window.electronAPI.openFile()
                setFileUrl(filePath)
              }}
            >
              {t('projects:SelectArchiveProject')}
            </button>
            <p className="my-6 text-center opacity-40">{fileUrl || t('NotSelected')}</p>
            <input
              className="btn-primary mr-3 mt-3 w-fit text-base"
              type="submit"
              value={t('Import')}
              disabled={!fileUrl}
            />
          </div>
        </form>
      </div>
    </>
  )
}

export default ImportProject
