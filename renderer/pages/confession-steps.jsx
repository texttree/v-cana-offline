import { useState, useEffect } from 'react'

import { useRouter } from 'next/router'

import CheckBox from '@/components/CheckBox'

import { useTranslation } from '@/next-i18next'

import LeftArrow from 'public/icons/arrow-left.svg'

export default function ConfessionSteps() {
  const { t } = useTranslation(['confession-steps', 'common', 'users'])
  const router = useRouter()
  const [isChecked, setIsChecked] = useState(false)
  const [page, setPage] = useState(0)

  const confessionSteps = [
    <p
      dangerouslySetInnerHTML={{
        __html: t('confession-steps:Step1', { interpolation: { escapeValue: false } }),
      }}
      key={1}
      className="text-center"
    />,
    <ul key={2} className="list-disc">
      {Object.entries(t('confession-steps:Step2')).map(([key, value]) => (
        <li key={key} className="pb-5">
          {value}
        </li>
      ))}
    </ul>,
    <ul key={3} className="list-disc">
      {Object.entries(t('confession-steps:Step3')).map(([key, value]) => (
        <li key={key} className="pb-5">
          {value}
        </li>
      ))}
    </ul>,
    <ul key={4} className="list-disc">
      {Object.entries(t('confession-steps:Step4')).map(([key, value]) => (
        <li key={key} className="pb-5">
          {value}
        </li>
      ))}
    </ul>,
    <ul key={5} className="list-disc">
      {Object.entries(t('confession-steps:Step5')).map(([key, value]) => (
        <li key={key} className="pb-5">
          {value}
        </li>
      ))}
    </ul>,
    <p key={6}>{t('confession-steps:Step6')}</p>,
  ]

  const prevPage = () => {
    setPage((prev) => {
      return prev > 0 ? prev - 1 : prev
    })
  }
  const nextPage = () => {
    setPage((prev) => {
      return prev < 5 ? prev + 1 : prev
    })
  }

  const handleKeyDown = (e) => {
    switch (e.keyCode) {
      case 37:
        prevPage()
        break
      case 39:
        nextPage()
        break
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleClick = async () => {
    const agreements = JSON.parse(window.electronAPI.getItem('agreements'))
    window.electronAPI.setItem(
      'agreements',
      JSON.stringify({ ...agreements, confession: isChecked })
    )
    router.push(`/agreements`)
  }

  return (
    <div className="layout-appbar">
      <h1 className="text-2xl md:text-4xl text-center">{t('users:Confession')}:</h1>
      <div className="flex flex-row h-full flex-wrap sm:flex-nowrap justify-evenly sm:justify-center w-full xl:w-4/5 max-w-7xl gap-4 text-sm sm:text-base lg:text-lg xl:text-xl">
        <div className="flex items-center">
          <button disabled={page < 1} onClick={prevPage} className="arrow">
            <LeftArrow className="w-6 stroke-th-text-primary" />
          </button>
        </div>
        <div className="flex flex-col w-full min-h-[30rem] bg-th-secondary-10 rounded-lg sm:mb-0 py-6 px-10 justify-center order-first sm:order-none">
          {confessionSteps[page]}
        </div>
        <div className="flex items-center">
          <button disabled={page > 4} onClick={nextPage} className="arrow">
            <LeftArrow className="w-6 rotate-180 stroke-th-text-primary" />
          </button>
        </div>
      </div>
      <div
        className={`flex flex-row items-center space-x-6 ${
          page === 5 ? '' : 'hidden sm:flex sm:invisible'
        }`}
      >
        <CheckBox
          onChange={() => setIsChecked((prev) => !prev)}
          checked={isChecked}
          className={{
            accent:
              'bg-th-secondary-10 checked:bg-th-secondary-400 checked:border-th-secondary-400 checked:before:bg-th-secondary-400 border-th-secondary',
            cursor: 'fill-th-secondary-10 text-th-secondary-10 stroke-th-secondary-10',
          }}
          label={t('users:Agree')}
        />
        <button onClick={handleClick} className="btn-primary w-28" disabled={!isChecked}>
          {t('common:Next')}
        </button>
      </div>
    </div>
  )
}
