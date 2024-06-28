import { useEffect, useState } from 'react'

import Link from 'next/link'

import { JsonToPdf } from '@texttree/obs-format-convert-rcl'
import { useTranslation } from '@/next-i18next'

import DownloadPDF from '../public/icons/download-pdf.svg'

const styles = {
  currentPage: {
    fontSize: 16,
    alignment: 'center',
    bold: true,
    margin: [0, 10, 0, 0],
  },
  chapterTitle: { fontSize: 20, bold: true, margin: [0, 26, 0, 15] },
  verseNumber: { sup: true, bold: true, opacity: 0.8, margin: [0, 8, 8, 0] },
  defaultPageHeader: { bold: true, width: '50%' },
  text: { alignment: 'justify' },
}

function ChapterList({ id, chapters, steps, mutate }) {
  const { t } = useTranslation(['projects', 'common'])

  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const config = window.electronAPI.getProject(id)
    setShowIntro(config.showIntro)
  }, [id])

  const handleBackStep = (chapter, step) => {
    const backStep = window.electronAPI.goToStep(id, chapter, step - 1)
    if (backStep !== step) {
      mutate()
    }
  }
  const handleDownloadChapter = (chapter) => {
    const savedVerses = Object.entries(window.electronAPI.getChapter(id, chapter)).map(
      ([k, v]) => ({ verse: k, text: v.text, enabled: v.enabled })
    )

    const project = window.electronAPI.getProject(id)
    const currentDate = new Date().toISOString().split('T')[0]

    const fileName = `${project.project}_${project.book.code}_c_${chapter}_${currentDate}`

    JsonToPdf({
      data: [{ title: 'Chapter ' + chapter, verseObjects: savedVerses }],
      styles,
      fileName,
      showImages: false,
      combineVerses: false,
      showChapterTitlePage: false,
      showVerseNumber: true,
      bookPropertiesObs: {},
      showPageFooters: false,
    })
      .then(() => console.log('PDF creation completed'))
      .catch((error) => console.error('PDF creation failed:', error))
  }
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full text-sm">
        <thead>
          <tr className="text-th-secondary-300 border-b border-th-secondary-200 cursor-default">
            <th className="w-3/12 min-w-28 font-medium pt-0 pr-2 pb-3 pl-2 text-left sm:pr-4 sm:pl-8">
              {t('projects:Chapter')}
            </th>
            <th className="w-4/12 min-w-32 font-medium pt-0 pr-2 pb-3 pl-2 text-left sm:pr-4 sm:pl-8">
              {t('projects:Step')}
            </th>
            <th className="w-3/12 min-w-28 font-medium pt-0 pr-2 pb-3 pl-2 text-center sm:pr-4 sm:pl-8">
              {t('projects:StepBack')}
            </th>
            <th className="w-2/12 min-w-20 font-medium pt-0 pr-2 pb-3 pl-2 text-center sm:pr-4 sm:pl-8">
              {t('common:Download')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-th-secondary-10">
          {chapters.map(([chapter, step]) => (
            <tr
              key={chapter}
              className="border-b border-th-secondary-200 text-th-primary-100"
            >
              <td className="p-2 sm:p-4 sm:pl-8">
                <Link
                  href={`/account/project/${id}/${chapter}/${showIntro ? 'intro' : step}${
                    showIntro ? `?step=${step}` : ''
                  }`}
                  legacyBehavior
                >
                  <a className="font-bold hover:opacity-70 break-words">
                    {t('projects:Chapter')} {chapter}
                  </a>
                </Link>
              </td>
              <td className="p-2 sm:p-4 sm:pl-8 cursor-default break-words">
                {steps[step].title}
              </td>
              <td className="p-2 sm:p-4 sm:pl-8">
                {step > 0 && (
                  <div
                    className="btn-primary text-sm py-2 px-3 select-none text-center whitespace-nowrap overflow-hidden text-ellipsis"
                    onClick={() => handleBackStep(chapter, step)}
                  >
                    {t('projects:BackToStep')}
                  </div>
                )}
              </td>
              <td className="p-2 sm:p-4 sm:pl-8">
                <div className="flex justify-center cursor-pointer">
                  <DownloadPDF
                    className="w-6 sm:w-8 hover:opacity-70"
                    onClick={() => handleDownloadChapter(chapter)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ChapterList
