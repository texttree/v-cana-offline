import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import { Tab } from '@headlessui/react'
import { useTranslation } from '@/next-i18next'
import { useRecoilValue } from 'recoil'

import Tool from '@/components/Tool'
import CheckBox from '@/components/CheckBox'
import Breadcrumbs from '@/components/Breadcrumbs'
import ProgressBar from '@/components/ProgressBar'

import { inactiveState } from '@/helpers/atoms'

import Dict from '@/public/icons/dictionary.svg'
import Notepad from '@/public/icons/notepad.svg'
import Audio from '@/public/icons/audio.svg'
import Pencil from '@/public/icons/editor-pencil.svg'
import Info from '@/public/icons/info.svg'
import TeamNote from '@/public/icons/team-note.svg'

const sizes = {
  1: 'lg:w-1/6',
  2: 'lg:w-2/6',
  3: 'lg:w-3/6',
  4: 'lg:w-4/6',
  5: 'lg:w-5/6',
  6: 'lg:w-full',
}

const translateIcon = <Pencil className="w-5 inline" />

const icons = {
  personalNotes: <Notepad className="w-5 inline" />,
  teamNotes: <TeamNote className="w-5 inline" />,
  dictionary: <Dict className="w-5 inline" />,
  retelling: <Audio className="w-5 inline" />,
  info: <Info className="w-5 inline" />,
  blindEditor: translateIcon,
  editor: translateIcon,
}

function StepPage() {
  const { t } = useTranslation()
  const {
    query: { id, chapter, step },
    push,
  } = useRouter()
  const inactive = useRecoilValue(inactiveState)

  const [project, setProject] = useState(false)
  const [checked, setChecked] = useState(false)
  const [activeTabIndexes, setActiveTabIndexes] = useState({})

  useEffect(() => {
    if (id) {
      const _project = window.electronAPI.getProject(id)
      if (_project && _project?.steps?.length <= parseInt(step)) {
        push(`/project/${id}`)
      } else {
        setProject(_project)
        setActiveTabIndexes({})
      }
    }
  }, [id, step])

  const nextStepHandle = () => {
    const nextStep = window.electronAPI.goToStep(id, chapter, parseInt(step) + 1)
    const config = window.electronAPI.getProject(id)
    const showIntro = config.showIntro

    if (nextStep !== parseInt(step)) {
      if (showIntro) {
        push(`/account/project/${id}/${chapter}/intro?step=${nextStep}`)
      } else {
        push(`/account/project/${id}/${chapter}/${nextStep}`)
      }
    } else {
      push(`/account/project/${id}`)
    }

    setChecked(false)
  }

  const getTotalTranslationSteps = (steps) => {
    return (steps || []).filter((step) => !step.isTech).length || 0
  }

  const getCurrentTranslationStepIndex = (steps, currentStep) => {
    let currentTranslationStep = 0
    let translationStepIndex = 0

    for (let i = 0; i <= currentStep; i++) {
      if (steps && !steps[i].isTech) {
        currentTranslationStep = translationStepIndex
        translationStepIndex++
      }
    }

    return currentTranslationStep + 1
  }

  return (
    <div className="w-full">
      <Breadcrumbs
        links={[
          {
            href: `/account/project/${id}`,
            title: `${project?.book?.name} ${chapter}`,
          },
        ]}
        currentTitle={project?.steps?.[step]?.title}
      />
      <div className="layout-step">
        {project?.steps?.[step] &&
          project.steps[step].cards.map((el, columnIndex) => (
            <div
              key={columnIndex}
              className={`layout-step-col ${
                columnIndex === 0 && inactive ? 'inactive' : ''
              } ${sizes[el.size]}`}
            >
              <Panel
                t={t}
                tools={el.tools}
                mainResource={project.mainResource}
                id={id}
                chapter={chapter}
                toolNames={project.resources}
                stepConfig={project.steps[step]}
                columnIndex={columnIndex}
                activeTabIndexes={activeTabIndexes}
                setActiveTabIndexes={setActiveTabIndexes}
              />
            </div>
          ))}
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center md:px-4 lg:px-2 mx-auto w-full mt-4 md:mt-2 md:h-16">
        <div className="hidden lg:block lg:w-1/3" />
        <div className="w-full lg:w-1/3 flex justify-center md:justify-start lg:justify-center">
          {project && !project.steps[step].isTech && (
            <ProgressBar
              amountSteps={getTotalTranslationSteps(project.steps)}
              currentStep={getCurrentTranslationStepIndex(project.steps, parseInt(step))}
            />
          )}
        </div>
        <div className="w-full lg:w-1/3 flex justify-end items-center my-4 md:my-0">
          <div className="flex flex-row items-center space-x-6">
            <CheckBox
              onChange={() => setChecked((prev) => !prev)}
              checked={checked}
              className={{
                accent:
                  'bg-th-secondary-10 checked:bg-th-secondary-400 checked:border-th-secondary-400 checked:before:bg-th-secondary-400 border-th-secondary',
                cursor:
                  'fill-th-secondary-10 text-th-secondary-10 stroke-th-secondary-10',
              }}
              id="goToNextStepCheckBox"
              label={t('Done')}
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
    </div>
  )
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Panel({
  tools,
  mainResource,
  id,
  chapter,
  toolNames,
  stepConfig,
  t,
  columnIndex,
  activeTabIndexes,
  setActiveTabIndexes,
}) {
  const [isSingleTab, setIsSingleTab] = useState(false)

  useEffect(() => {
    handleTabsCount()
  }, [tools])

  const handleTabsCount = () => {
    if (tools.length === 1) {
      setIsSingleTab(true)
    } else {
      setIsSingleTab(false)
    }
  }

  return (
    <Tab.Group
      selectedIndex={activeTabIndexes[columnIndex] || 0}
      onChange={(index) =>
        setActiveTabIndexes((prev) => ({
          ...prev,
          [columnIndex]: index,
        }))
      }
    >
      <Tab.List
        className={`flex overflow-auto text-xs -mb-2 lg:-mb-7
      ${!isSingleTab ? 'px-3 space-x-3' : ''}
      `}
      >
        {tools?.map((tool, idx) => (
          <Tab
            key={tool.name + idx}
            className={({ selected }) =>
              classNames(
                'text-xs p-1 lg:pb-3 md:p-2 md:text-sm lg:text-base text-ellipsis overflow-hidden whitespace-nowrap',
                isSingleTab ? 'flex' : 'flex-1',
                selected ? (isSingleTab ? 'tab-single' : 'tab-active') : 'tab-inactive'
              )
            }
          >
            {[
              'editor',
              'commandTranslate',
              'blindEditor',
              'teamNotes',
              'personalNotes',
              'retelling',
              'dictionary',
              'merger',
              'info',
            ].includes(tool.name) ? (
              <span title={t(tool.name)}>
                {icons[tool.name] ? (
                  <div className={`${!isSingleTab ? 'truncate' : 'px-5 sm:px-10'}`}>
                    {icons[tool.name]}
                    <span className="hidden ml-2 sm:inline">{t(tool.name)}</span>
                  </div>
                ) : (
                  <span
                    className={`${!isSingleTab ? 'hidden sm:inline' : 'px-10 sm:px-20'}`}
                  >
                    {t(tool.name)}
                  </span>
                )}
              </span>
            ) : (
              <p className={`${!isSingleTab ? 'truncate' : 'px-10 sm:px-20'} `}>
                {toolNames[tool.config.resource]}
              </p>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        {tools?.map((tool, index) => {
          return (
            <Tab.Panel key={index}>
              <div className="flex flex-col bg-white rounded-xl h-full">
                <Tool
                  config={{
                    mainResource,
                    id,
                    chapter,
                    ...tool.config,
                    wholeChapter: stepConfig.whole_chapter,
                  }}
                  toolName={tool.name}
                  isSingleTab={isSingleTab}
                />
              </div>
            </Tab.Panel>
          )
        })}
      </Tab.Panels>
    </Tab.Group>
  )
}

export default StepPage
