import { app, ipcMain, dialog } from 'electron'
import serve from 'electron-serve'
import Store from 'electron-store'
import { createWindow } from './helpers'
import { v4 as uuid } from 'uuid'
import path from 'path'
import { toJSON } from 'usfm-js'
import { markRepeatedWords } from '@texttree/translation-words-helpers'
const fs = require('fs')
import i18next from '../next-i18next.config.js'
import { localeStore } from './helpers/user-store'

import {
  formatToString,
  tsvToJSON,
  selectionsFromQuoteAndVerseObjects,
  parseVerseObjects,
} from '@texttree/tn-quote-helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', path.join(__dirname, '../', `.AppData`))
  fs.mkdirSync(path.join(app.getPath('userData'), `projects`), {
    recursive: true,
  })
}

let projectUrl = path.join(app.getPath('userData'), 'projects')

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    buttonLabel: 'Создать проект',
    filters: [{ name: 'Zip Archives', extensions: ['zip'] }],
  })
  if (!canceled) {
    return filePaths[0]
  }
}

async function handleConfigOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    buttonLabel: 'Открыть конфиг',
  })
  if (!canceled) {
    let { mainResource, resources } = JSON.parse(fs.readFileSync(filePaths[0]))
    resources = resources.map((el) => ({
      name: el,
      isMain: el === mainResource,
    }))
    return { url: filePaths[0], resources }
  }
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1400,
    height: 800,
    backgroundColor: '#fff',
    autoHideMenuBar: isProd,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL(`app://./home`)
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

const storeProjects = new Store({ name: 'projects' })

const storeLS = new Store({ name: 'localStorage' })

ipcMain.on('get-projects', (event) => {
  const projects = storeProjects.get('projects') || []
  event.returnValue = projects
  event.sender.send('notify', 'Loaded')
})

let personalNotesLS
let teamNotesLS

const getNotesWithType = (type) => {
  let notes
  switch (type) {
    case 'personal-notes':
      notes = personalNotesLS
      break
    case 'team-notes':
      notes = teamNotesLS
      break
    default:
      notes = []
      break
  }
  return notes
}
let dictionaryLS

ipcMain.on('set-project-folder', (event, id) => {
  personalNotesLS = new Store({ name: 'personal-notes', cwd: `projects/${id}` })
  dictionaryLS = new Store({ name: 'dictionary', cwd: `projects/${id}` })
  teamNotesLS = new Store({ name: 'team-notes', cwd: `projects/${id}` })
})

ipcMain.on('get-words', (event) => {
  event.returnValue = dictionaryLS.store
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('add-word', (event, projectid, wordid) => {
  const date = new Date()
  const title = date.toLocaleString()
  dictionaryLS.set(wordid, {
    id: wordid,
    title,
    parent: null,
    is_folder: false,
    created_at: date.getTime(),
  })
  const data = {
    id: wordid,
    created_at: date.getTime(),
    title,
    data: {
      blocks: [],
      version: '2.8.1',
    },
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'dictionary', wordid + '.json'),
    JSON.stringify(data, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = wordid
  event.sender.send('notify', 'Updated')
})

ipcMain.on('import-word', (event, projectid, newword) => {
  const { id, title, parent, is_folder, created_at, data: content } = newword
  const date = new Date()
  dictionaryLS.set(id, {
    id,
    title,
    parent,
    is_folder,
    created_at: date.getTime(),
  })
  const data = {
    id,
    created_at: date.getTime(),
    title,
    data: content,
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'dictionary', id + '.json'),
    JSON.stringify(data, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = id
  event.sender.send('notify', 'Updated')
})
ipcMain.on('import-note', (event, projectid, note, type) => {
  const { id, title, parent_id, is_folder, data: content, sorting } = note
  const date = new Date()
  const notes = getNotesWithType(type)
  notes.set(id, {
    id,
    title,
    parent_id,
    is_folder,
    created_at: date.getTime(),
    sorting,
  })
  const data = {
    id,
    created_at: date.getTime(),
    title,
    data: content,
    sorting,
    is_folder,
    parent_id,
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, type, id + '.json'),
    JSON.stringify(data, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = id
  event.sender.send('notify', 'Updated')
})

ipcMain.on('update-word', (event, projectid, word) => {
  dictionaryLS.set(`${word.id}.title`, word.title)
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'dictionary', word.id + '.json'),
    JSON.stringify(word, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = word.id
  event.sender.send('notify', 'Updated')
})

ipcMain.on('get-lang', (event) => {
  event.returnValue = localeStore.get('locale', i18next.i18n.defaultLocale)
})

ipcMain.on('get-i18n', (event, ns = 'common') => {
  const lang = localeStore.get('locale', i18next.i18n.defaultLocale)
  let res = {}
  let fileDest
  if (isProd) {
    fileDest = path.join(__dirname, 'locales/')
  } else {
    fileDest = path.resolve('./renderer/public/locales/')
  }

  if (Array.isArray(ns)) {
    ns.forEach((n) => {
      res[n] = JSON.parse(
        fs.readFileSync(path.join(fileDest, lang, n + '.json'), {
          encoding: 'utf-8',
        })
      )
    })
  } else {
    res[ns] = JSON.parse(
      fs.readFileSync(path.join(fileDest, lang, ns + '.json'), {
        encoding: 'utf-8',
      })
    )
  }
  event.returnValue = res
})

ipcMain.on('get-word', (event, projectid, wordid) => {
  const data = fs.readFileSync(
    path.join(projectUrl, projectid, 'dictionary', wordid + '.json'),
    { encoding: 'utf-8' }
  )
  event.returnValue = data
  event.sender.send('notify', 'Loaded')
})
ipcMain.on('get-words-with-data', (event, projectid, wordids) => {
  let words = []
  wordids.forEach((wordid) => {
    const data = fs.readFileSync(
      path.join(projectUrl, projectid, 'dictionary', wordid + '.json'),
      { encoding: 'utf-8' }
    )
    words.push(JSON.parse(data))
  })

  event.returnValue = words
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('remove-word', (event, projectid, wordid) => {
  dictionaryLS.delete(wordid)
  fs.rmSync(path.join(projectUrl, projectid, 'dictionary', wordid + '.json'), {
    force: true,
  })
  event.returnValue = wordid
  event.sender.send('notify', 'Removed')
})

ipcMain.on('get-notes', (event, type) => {
  const notes = getNotesWithType(type)
  event.returnValue = notes.store
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-notes-with-data', (event, projectid, type) => {
  let notes = []
  const notesLS = getNotesWithType(type)

  for (const noteId in notesLS.store) {
    if (Object.hasOwnProperty.call(notesLS.store, noteId)) {
      const note = notesLS.store[noteId]
      const newNote = fs.readFileSync(
        path.join(projectUrl, projectid, type, note.id + '.json'),
        { encoding: 'utf-8' }
      )
      const { data } = JSON.parse(newNote)
      notes.push({ ...note, data })
    }
  }
  event.returnValue = notes
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('add-note', (event, projectid, noteid, isfolder, sorting, type) => {
  const notesLS = getNotesWithType(type)
  const date = new Date()
  const title = date.toLocaleString()
  notesLS.set(noteid, {
    id: noteid,
    title,
    parent_id: null,
    is_folder: isfolder,
    created_at: date.getTime(),
    sorting,
  })
  const data = {
    id: noteid,
    created_at: date.getTime(),
    title,
    data: {
      blocks: [],
      version: '2.29.1',
    },
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, type, noteid + '.json'),
    JSON.stringify(data, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = noteid
  event.sender.send('notify', 'Updated')
})

ipcMain.on('update-note', (event, projectid, note, type) => {
  const notesLS = getNotesWithType(type)
  notesLS.set(`${note.id}.title`, note.title)
  fs.writeFileSync(
    path.join(projectUrl, projectid, type, note.id + '.json'),
    JSON.stringify(note, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = note.id
  event.sender.send('notify', 'Updated')
})

ipcMain.on('rename-note', (event, projectid, title, noteid, type) => {
  const notesLS = getNotesWithType(type)

  notesLS.set(`${noteid}.title`, title)
  const data = fs.readFileSync(path.join(projectUrl, projectid, type, noteid + '.json'), {
    encoding: 'utf-8',
  })
  const newNote = JSON.parse(data)

  fs.writeFileSync(
    path.join(projectUrl, projectid, type, noteid + '.json'),
    JSON.stringify({ ...newNote, title }, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = noteid
  event.sender.send('notify', 'Updated')
})

ipcMain.on('get-note', (event, projectid, noteid, type) => {
  const data = fs.readFileSync(path.join(projectUrl, projectid, type, noteid + '.json'), {
    encoding: 'utf-8',
  })
  event.returnValue = data
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('remove-note', (event, projectid, noteid, type) => {
  const notesLS = getNotesWithType(type)

  notesLS.delete(noteid)
  fs.rmSync(path.join(projectUrl, projectid, type, noteid + '.json'), {
    force: true,
  })
  event.returnValue = noteid
  event.sender.send('notify', 'Removed')
})

ipcMain.on('remove-all-notes', (event, projectid, type) => {
  const notesLS = getNotesWithType(type)

  notesLS.clear()
  fs.readdirSync(path.join(projectUrl, projectid, type)).forEach((f) =>
    fs.rmSync(path.join(projectUrl, projectid, type, f))
  )
  event.returnValue = projectid
  event.sender.send('notify', 'Removed')
})

ipcMain.on('update-notes', (event, projectid, notes, type) => {
  const notesLS = getNotesWithType(type)

  notes.forEach((note) => {
    notesLS.set(`${note.id}.parent_id`, note.parent_id)
    notesLS.set(`${note.id}.sorting`, note.sorting)
  })
  event.returnValue = projectid
  event.sender.send('notify', 'Updated')
})

ipcMain.on('get-book', (event, projectid) => {
  const book = {}
  fs.readdirSync(path.join(projectUrl, projectid, 'chapters')).forEach((f) => {
    const data = fs.readFileSync(path.join(projectUrl, projectid, 'chapters', f), {
      encoding: 'utf-8',
    })
    book[f.split('.')[0]] = JSON.parse(data)
  })
  event.returnValue = book
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-chapter', (event, projectid, chapter) => {
  const data = fs.readFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    { encoding: 'utf-8' }
  )
  event.returnValue = JSON.parse(data)
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('update-chapter', (event, projectid, chapter, data) => {
  const chapterData = JSON.parse(
    fs.readFileSync(path.join(projectUrl, projectid, 'chapters', chapter + '.json'), {
      encoding: 'utf-8',
    })
  )
  for (const verse in data) {
    if (Object.hasOwnProperty.call(data, verse)) {
      chapterData[verse].text = data[verse].text
    }
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    JSON.stringify(chapterData, null, 2),
    { encoding: 'utf-8' }
  )
  event.returnValue = chapter
  event.sender.send('notify', 'Updated')
})

ipcMain.on('update-verse', (event, projectid, chapter, verse, text) => {
  const chapterData = JSON.parse(
    fs.readFileSync(path.join(projectUrl, projectid, 'chapters', chapter + '.json'), {
      encoding: 'utf-8',
    })
  )
  chapterData[verse].text = text
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    JSON.stringify(chapterData, null, 2),
    { encoding: 'utf-8' }
  )
  event.sender.send('notify', 'Updated')
})

ipcMain.on('divide-verse', (event, projectid, chapter, verse, enabled) => {
  const chapterData = JSON.parse(
    fs.readFileSync(path.join(projectUrl, projectid, 'chapters', chapter + '.json'), {
      encoding: 'utf-8',
    })
  )
  chapterData[verse].enabled = enabled
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    JSON.stringify(chapterData, null, 2),
    { encoding: 'utf-8' }
  )
  event.sender.send('notify', 'Updated')
})

ipcMain.on('set-item', (event, key, val) => {
  storeLS.set(key, val)
  event.sender.send('notify', 'Updated')
})

ipcMain.on('get-item', (event, key) => {
  const projects = storeLS.get(key) || false
  event.returnValue = projects
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('remove-item', (event, key) => {
  storeLS.delete(key)
  event.sender.send('notify', 'Removed')
})

ipcMain.on('get-usfm', (event, id, resource, chapter) => {
  const usfm = fs.readFileSync(path.join(projectUrl, id, resource + '.usfm'), {
    encoding: 'utf-8',
  })
  const jsonData = toJSON(usfm)
  event.returnValue = jsonData.chapters[chapter]
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-tq', (event, id, resource, mainResource, chapter) => {
  const tq = fs.readFileSync(path.join(projectUrl, id, resource + '.tsv'), {
    encoding: 'utf-8',
  })

  const jsonData = tsvToJSON(
    tq,
    ['Reference', 'ID', 'Tags', 'Quote', 'Occurrence', 'Question', 'Response'],
    true
  )
  const rangeVerses = []
  const currentChapter = jsonData.filter((el) => {
    if (el.chapter.toString() !== chapter.toString()) {
      return false
    }

    if (el.verse.length > 1) {
      for (let i = 0; i < el.verse.length; i++) {
        rangeVerses.push({ ...el, Reference: chapter + ':' + el.verse[i] })
      }
      return
    }

    return true
  })

  const data = [...currentChapter, ...rangeVerses]

  const questions = {}
  data?.forEach((el) => {
    const verse = el.Reference.split(':').slice(-1)[0]
    const tq = {
      id: `${el.ID}-v${verse}`,
      question: el.Question,
      answer: el.Response,
    }
    if (!questions[verse]) {
      questions[verse] = [tq]
    } else {
      questions[verse].push(tq)
    }
  })

  event.returnValue = questions
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-zip', (event, id, resource, chapter) => {
  const zip = fs.readFileSync(path.join(projectUrl, id, resource + '.zip'))
  event.returnValue = zip
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-tn', (event, id, resource, mainResource, chapter) => {
  const _data = fs.readFileSync(path.join(projectUrl, id, resource + '.tsv'), {
    encoding: 'utf-8',
  })
  const jsonData = tsvToJSON(
    _data,
    ['Reference', 'Occurrence', 'Quote', 'ID', 'Note'],
    true
  )
  const greekUsfm = fs.readFileSync(path.join(projectUrl, id, 'original.usfm'), {
    encoding: 'utf-8',
  })
  const greek = toJSON(greekUsfm).chapters[chapter]
  const targetUsfm = fs.readFileSync(path.join(projectUrl, id, mainResource + '.usfm'), {
    encoding: 'utf-8',
  })
  const target = toJSON(targetUsfm).chapters[chapter]
  const data = jsonData?.filter((el) => {
    // пропускаем, если это не наша глава или это введение
    return el.chapter === chapter && !el.verse.includes('intro')
  })
  data.map((selectedTn) => {
    const selections = selectionsFromQuoteAndVerseObjects({
      quote: selectedTn.Quote,
      verseObjects: greek[selectedTn.verse].verseObjects,
      occurrence: selectedTn.Occurrence,
      chapter: chapter,
      verses: [selectedTn.verse],
    })

    const result = target[selectedTn.verse].verseObjects.map((el) =>
      parseVerseObjects(el, selections, {
        chapter: chapter,
        verse: selectedTn.verse,
      })
    )

    const res = formatToString(result)
    selectedTn.origQuote = selectedTn.Quote
    selectedTn.Quote = res
    return selectedTn
  })
  event.returnValue = data
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-info', (event, id, resource, mainResource, chapter) => {
  const _data = fs.readFileSync(path.join(projectUrl, id, resource + '.tsv'), {
    encoding: 'utf-8',
  })
  const jsonData = tsvToJSON(
    _data,
    ['Reference', 'Occurrence', 'Quote', 'ID', 'Note'],
    true
  )
  const intros = {}

  jsonData?.forEach((el) => {
    const [chapterNote, verseNote] = el.Reference
      ? el.Reference.split(':')
      : [el.Chapter, el.Verse]
    // пропускаем, если это не наша глава и не введение
    if (chapterNote !== chapter && chapterNote !== 'front') {
      return
    }
    if (verseNote !== 'intro') {
      return
    }

    const newNote = {
      id: el.ID,
      text: el?.OccurrenceNote || el?.Note,
      title: chapterNote === 'front' ? 'bookIntro' : 'chapterIntro',
    }
    intros[newNote.title] = newNote.text
  })
  event.returnValue = intros
  event.sender.send('notify', 'Loaded')
})

ipcMain.on('get-twl', (event, id, resource, mainResource, chapter) => {
  const _data = fs.readFileSync(path.join(projectUrl, id, resource + '.tsv'), {
    encoding: 'utf-8',
  })
  const jsonData = tsvToJSON(
    _data,
    ['Reference', 'ID', 'Tags', 'OrigWords', 'Occurrence', 'TWLink'],
    true
  )
  const markedWords = markRepeatedWords(jsonData, 'all')
  const data = markedWords.filter(
    (wordObject) => chapter.toString() === wordObject.chapter.toString()
  )
  event.returnValue = data
  event.sender.send('notify', 'Loaded')
})

const saveStepData = (projectid, chapter, step) => {
  const chapterData = JSON.parse(
    fs.readFileSync(path.join(projectUrl, projectid, 'chapters', chapter + '.json'), {
      encoding: 'utf-8',
    })
  )
  const time = Date.now()
  for (const verse in chapterData) {
    if (Object.hasOwnProperty.call(chapterData, verse)) {
      chapterData[verse].history.push({
        step: parseInt(step),
        time,
        text: chapterData[verse].text,
      })
    }
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    JSON.stringify(chapterData, null, 2),
    { encoding: 'utf-8' }
  )
}

const restoreStepData = (projectid, chapter, step) => {
  const chapterData = JSON.parse(
    fs.readFileSync(path.join(projectUrl, projectid, 'chapters', chapter + '.json'), {
      encoding: 'utf-8',
    })
  )
  const time = Date.now()
  for (const verse in chapterData) {
    if (Object.hasOwnProperty.call(chapterData, verse)) {
      chapterData[verse].history.push({
        step: parseInt(step),
        time,
        text: chapterData[verse].text,
      })
      chapterData[verse].text = chapterData[verse].history.reduce(
        (acc, cur) => {
          if (cur.time >= acc.time && cur.step === acc.step) {
            return cur
          } else {
            return acc
          }
        },
        { time: 0, text: '', step: parseInt(step) - 1 }
      ).text
    }
  }
  fs.writeFileSync(
    path.join(projectUrl, projectid, 'chapters', chapter + '.json'),
    JSON.stringify(chapterData, null, 2),
    { encoding: 'utf-8' }
  )
}

ipcMain.on('update-project-config', (event, id, updatedConfig) => {
  const configPath = path.join(projectUrl, id, 'config.json')

  try {
    const currentConfig = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))
    const mergedConfig = { ...currentConfig, ...updatedConfig }

    if (updatedConfig.hasOwnProperty('showIntro')) {
      mergedConfig.showIntro = updatedConfig.showIntro
    }

    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), {
      encoding: 'utf-8',
    })

    event.sender.send('update-project-config-reply', true)
  } catch (error) {
    console.error(`Error updating project config: ${error}`)
    event.sender.send('update-project-config-reply', false)
  }
})

ipcMain.on('go-to-step', async (event, id, chapter, step) => {
  const config = JSON.parse(
    fs.readFileSync(path.join(projectUrl, id, 'config.json'), {
      encoding: 'utf-8',
    })
  )
  const oldStep = config.chapters[chapter]
  let newStep = step
  if (parseInt(step) >= 0 && config.steps.length > parseInt(step)) {
    config.chapters[chapter] = newStep
    fs.writeFileSync(
      path.join(projectUrl, id, 'config.json'),
      JSON.stringify(config, null, 2),
      { encoding: 'utf-8' }
    )
  } else {
    newStep = parseInt(step) < 0 ? 0 : config.steps.length - 1
  }
  if (newStep > oldStep) {
    saveStepData(id, chapter, oldStep)
  }
  if (newStep < oldStep) {
    // restoreStepData(id, chapter, oldStep); Пока решил закрыть, чтобы данные не потерять во время тестирования
  }
  if (newStep === oldStep && oldStep === config.steps.length - 1) {
    saveStepData(id, chapter, oldStep)
  }
  event.returnValue = newStep
})

ipcMain.on('get-project', async (event, id) => {
  const config = JSON.parse(
    fs.readFileSync(path.join(projectUrl, id, 'config.json'), {
      encoding: 'utf-8',
    })
  )

  event.returnValue = config
  event.sender.send('notify', 'Project Loaded')
})

ipcMain.on('add-project', async (event, url) => {
  let tempDir = null
  const defaultProperties = {
    h: '',
    toc1: '',
    toc2: '',
    toc3: '',
    mt: '',
    chapter_label: '',
  }

  const createPropertiesFile = async (projectId, properties) => {
    const projectPath = path.join(projectUrl, projectId)
    const propertiesPath = path.join(projectPath, 'properties.json')

    await fs.promises.writeFile(propertiesPath, JSON.stringify(properties, null, 2))
  }

  const validateProjectStructure = (projectPath) => {
    const requiredFolders = ['chapters', 'dictionary', 'personal-notes', 'team-notes']
    const configFile = 'config.json'

    for (const folder of requiredFolders) {
      if (!fs.existsSync(path.join(projectPath, folder))) {
        throw new Error(`Missing required folder!`)
      }
    }

    if (!fs.existsSync(path.join(projectPath, configFile))) {
      throw new Error(`Missing required file!`)
    }

    const configContent = fs.readFileSync(path.join(projectPath, configFile), 'utf-8')
    const config = JSON.parse(configContent)
    if (
      !config.book ||
      typeof config.book !== 'object' ||
      !config.book.code ||
      !config.book.name
    ) {
      throw new Error('Invalid book structure in config.json')
    }
    if (!config.project || typeof config.project !== 'string') {
      throw new Error('Invalid project in config.json')
    }
    if (!config.method || typeof config.method !== 'string') {
      throw new Error('Invalid method in config.json')
    }
  }

  if (url) {
    try {
      const projects = storeProjects.get('projects') || []
      const id = uuid()
      const createdAt = Date.now()
      const project = { id, createdAt }
      const decompress = require('decompress')

      tempDir = path.join(projectUrl, 'temp_' + id)
      await decompress(url, tempDir)

      validateProjectStructure(tempDir)

      const finalDir = path.join(projectUrl, id)
      await fs.promises.rename(tempDir, finalDir)

      const config = JSON.parse(
        await fs.promises.readFile(path.join(finalDir, 'config.json'), 'utf-8')
      )

      config.showIntro = true

      const configPath = path.join(finalDir, 'config.json')
      try {
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2))
      } catch (error) {
        console.error('Error writing config file:', error)
        throw new Error('Failed to write config file')
      }

      project.book = { ...config.book }
      project.name = config.project
      project.method = config.method

      await createPropertiesFile(id, defaultProperties)

      projects.push(project)
      storeProjects.set('projects', projects)
      event.sender.send('notify', 'Created')

      const updatedProjects = storeProjects.get('projects') || []
      event.sender.send('project-added', id, project, updatedProjects)
    } catch (error) {
      console.error('Error adding project:', error)
      event.sender.send('notify', `Error: ${error.message}`)

      if (tempDir && fs.existsSync(tempDir)) {
        await fs.promises.rm(tempDir, { recursive: true })
      }
      event.sender.send('project-add-error', error.message)
    }
  } else {
    event.sender.send('notify', 'Url not set')
  }
})

ipcMain.on('get-properties', (event, projectId) => {
  const propertiesPath = path.join(projectUrl, projectId, 'properties.json')
  try {
    const propertiesData = fs.readFileSync(propertiesPath, 'utf8')
    event.returnValue = JSON.parse(propertiesData)
  } catch (err) {
    console.error(`Error reading properties file for project ${projectId}:`, err)
    event.returnValue = {}
  }
})

ipcMain.on('update-properties', (event, projectId, properties) => {
  const propertiesPath = path.join(projectUrl, projectId, 'properties.json')
  try {
    fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2))
    event.returnValue = true
  } catch (err) {
    console.error(`Error writing properties file for project ${projectId}:`, err)
    event.returnValue = false
  }
})

ipcMain.on('update-project-name', (event, projectId, newName) => {
  const projects = storeProjects.get('projects') || []
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId) {
      return {
        ...project,
        book: {
          ...project.book,
          name: newName,
        },
      }
    }
    return project
  })
  storeProjects.set('projects', updatedProjects)
  event.sender.send('project-name-updated', projectId, newName)
})

ipcMain.on('delete-project', (event, projectId) => {
  const projectsFilePath = path.join(app.getPath('userData'), 'projects.json')
  const projectsData = JSON.parse(fs.readFileSync(projectsFilePath, 'utf8'))

  projectsData.projects = projectsData.projects.filter(
    (project) => project.id !== projectId
  )

  fs.writeFileSync(projectsFilePath, JSON.stringify(projectsData, null, 2))

  const projectDirPath = path.join(projectUrl, projectId)
  fs.rm(projectDirPath, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error when deleting project folder: ${err}`)
      event.sender.send('notify', 'Error deleting project')
      return
    }
    event.sender.send('notify', 'Project deleted')

    event.sender.send('projects-updated', projectsData.projects)
  })
})

ipcMain.handle('dialog:openFile', handleFileOpen)
ipcMain.handle('dialog:openConfig', handleConfigOpen)
