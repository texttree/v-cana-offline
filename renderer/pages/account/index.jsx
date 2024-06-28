import { useEffect, useState } from 'react'

import Head from 'next/head'

import { useTranslation } from '@/next-i18next'
import toast from 'react-hot-toast'

import ProjectsList from '@/components/ProjectsList'
import Modal from '@/components/Modal'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function Account() {
  const { t } = useTranslation(['common', 'projects'])

  const [projectsList, setProjectsList] = useState([])
  const [isOpenImportModal, setIsOpenImportModal] = useState(false)
  const [fileUrl, setFileUrl] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      const { updatedProjects } = await window.electronAPI.addProject(fileUrl)
      setProjectsList(updatedProjects || [])
      closeModal()
      toast.success(t('projects:SuccessfullyAddedProject'))
    } catch (error) {
      console.error('Failed to add project:', error)
      toast.error(t('projects:FailedAddProject'))
    }
  }

  useEffect(() => {
    const handleProjectAdded = (event) => {
      const { updatedProjects } = event.detail
      setProjectsList(updatedProjects)
    }

    window.addEventListener('project-added', handleProjectAdded)

    return () => {
      window.removeEventListener('project-added', handleProjectAdded)
    }
  }, [])

  const closeModal = () => {
    setIsOpenImportModal(false)
    setFileUrl('')
  }

  return (
    <>
      <Head>
        <title>{t('V-CANA')}</title>
      </Head>

      <div className="text-2xl w-full">
        <Breadcrumbs />
        <h2 className="my-6 text-4xl">{t('Projects')}</h2>
        <div className="py-4 mb-10">
          <ProjectsList projectsList={projectsList} setProjectsList={setProjectsList} />
        </div>
        <button
          className="btn-primary text-base"
          onClick={() => setIsOpenImportModal(true)}
        >
          {t('Import')}
        </button>
      </div>
      <Modal
        title={t('projects:ImportProject')}
        closeHandle={closeModal}
        isOpen={isOpenImportModal}
        className={{
          contentBody: 'max-h-[70vh] overflow-y-auto px-8',
        }}
        buttons={
          <button className="btn-secondary my-4" onClick={closeModal}>
            {t('Close')}
          </button>
        }
      >
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4">
            <button
              className="btn-primary text-base mt-3"
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
              className="btn-primary text-base mt-3 mr-3"
              type="submit"
              value={t('Import')}
              disabled={!fileUrl}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
