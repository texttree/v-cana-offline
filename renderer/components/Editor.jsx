import { useEffect, useState } from 'react'

import { obsCheckAdditionalVerses } from './Bible'

function Editor({ config: { id, chapter = false, wholeChapter } }) {
  const [verseObjects, setVerseObjects] = useState([])
  useEffect(() => {
    const savedVerses = Object.entries(window.electronAPI.getChapter(id, chapter)).map(
      ([k, v]) => ({ num: k, verse: v.text, enabled: v.enabled })
    )

    setVerseObjects(wholeChapter ? savedVerses : savedVerses.filter((v) => v.enabled))
  }, [id, chapter])

  const updateVerse = (idx, verseNum, text) => {
    setVerseObjects((prev) => {
      prev[idx].verse = text
      window.electronAPI.updateVerse(id, chapter, verseNum.toString(), text)
      return [...prev]
    })
  }
  return (
    <div>
      {verseObjects.map((verseObject, idx) => (
        <div key={verseObject.num} className="flex my-3">
          <div>{obsCheckAdditionalVerses(verseObject.num)}</div>
          <AutoSizeTextArea
            idx={idx}
            verseObject={verseObject}
            updateVerse={updateVerse}
          />
        </div>
      ))}
      <div className="select-none">ㅤ</div>
    </div>
  )
}

export default Editor

export function AutoSizeTextArea({ updateVerse, verseObject, idx }) {
  const [startValue, setStartValue] = useState(false)

  useEffect(() => {
    if (startValue === false) {
      setStartValue(verseObject.verse?.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseObject.verse])

  return (
    <div
      key={idx}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onBlur={(el) => {
        updateVerse(idx, verseObject.num, el.target.innerText.trim())
      }}
      onInput={(e) => {
        if (['historyUndo', 'historyRedo'].includes(e.nativeEvent.inputType)) {
          updateVerse(idx, verseObject.num, e.target.innerText.trim())
        }
      }}
      className={`block w-full mx-3 focus:outline-none focus:inline-none whitespace-pre-line focus:bg-th-secondary-10  ${
        verseObject.verse ? '' : 'bg-th-secondary-200'
      }`}
      // eslint-disable-next-line prettier/prettier
    >
      {startValue}
    </div>
  )
}
