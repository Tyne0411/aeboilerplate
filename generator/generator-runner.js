#!/usr/bin/env node

const shell = require('shelljs')
const colors = require('colors')
const fs = require('fs')
var readdirRecursive = require('recursive-readdir')
const replace = require('replace-in-file')

const clientGeneratorPath = `${process.cwd()}`
const clientAppPath = '../client'
const resourcesFilesPath = './resources'
const totalSteps = 10

const run = async () => {
  try {
    gitInit()
    await createReactApp()
    await updateAppResources()
    await updateAppEntryPoint()
    await updateAppInitialConfig()
    await addReduxStoreProvider()
    await addReactRouter()
    await installDependencies()
    deleteUnnecessaryFiles()
    changeClientPackageFile()
    showSuccessMessage()
  } catch (error) {
    console.log(error, 'Something went wrong with the client generator'.red)
  }
}

const gitInit = () => {
  logStepHeaderMessage('Initializing git repository', 1)
  shell.exec('cd .. && git init')
}

const createReactApp = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Running create-react-app with TypeScript and SASS (@petejkim/react-scripts-ts-sass)', 2)

    const createReactAppCommand = `create-react-app ${clientAppPath} --scripts-version="@petejkim/react-scripts-ts-sass" --use-npm`

    const onSuccess = () => {
      console.log('\nReact app created'.green)
      resolve(true)
    }

    shell.exec(createReactAppCommand, onSuccess)
  })
}

const updateAppResources = () => {
  return new Promise(async (resolve) => {
    logStepHeaderMessage('Updating client resources', 3)
    createFolders()
    const resourcesFiles = await mapResourceFiles()
    copyResourceFiles(resourcesFiles, resolve)
  })
}

const createFolders = () => {
  console.log('Creating client folders')
  shell.mkdir('../client/__mocks__')
  shell.mkdir('../client/src/api')
  shell.mkdir('../client/src/api/me')
  shell.mkdir('../client/src/config')
  shell.mkdir('../client/src/redux')
  shell.mkdir('../client/src/redux/ducks')
  shell.mkdir('../client/src/containers')
  shell.mkdir('../client/src/containers/app')
  shell.mkdir('../client/src/containers/connect')
  shell.mkdir('../client/src/containers/home')
  shell.mkdir('../client/src/containers/user')
}

const mapResourceFiles = async () => {
  console.log('Mapping resource files')

  const resourcesFiles = []
  const files = await readdirRecursive(resourcesFilesPath)

  files.forEach((file) => {
    file = file.replace('resources/', '')
    console.log('\tAdding resource file', file)
    resourcesFiles.push(file)
  })

  return resourcesFiles
}

const copyResourceFiles = (resourcesFiles, resolve) => {
  console.log('Copying resource files')

  const configPromises = resourcesFiles.map((resource) => copyFile(resource))

  Promise.all(configPromises).then(() => {
    console.log(`${resourcesFiles.length} resources copied from generator to client`)
    resolve()
  })
}

const copyFile = (resource) => {
  return new Promise((resolve) => {
    const fromGeneratorResourcesPath = `${clientGeneratorPath}/resources/${resource}`

    const toClientResourcesPath = `${clientAppPath}/${resource}`

    const onErrorHandler = (error) => {
      error && console.log(error.red)
      resolve()
    }

    fs.copyFile(fromGeneratorResourcesPath, toClientResourcesPath, onErrorHandler)
  })
}

const updateAppEntryPoint = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Updating react app entry point', 4)

    const replaceFrom = "import App from './App'"
    const replaceTo = "import { App } from './containers/app/App'"

    replaceText(resolve, replaceFrom, replaceTo)
  })
}

const updateAppInitialConfig = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Initializing axios, redux store and react router', 5)

    const replaceFrom = "import registerServiceWorker from './registerServiceWorker'"
    const replaceTo = `import registerServiceWorker from './registerServiceWorker' \n\n
    import { Provider } from 'react-redux'
    import { BrowserRouter as Router, Route } from 'react-router-dom'
    import { setupAxios } from './api/setup-axios'
    import { configureStore } from './redux/configure-store' \n\n
    setupAxios() \n\n
    const store = configureStore() \n\n`

    replaceText(resolve, replaceFrom, replaceTo)
  })
}

const addReduxStoreProvider = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Adding redux store provider', 6)

    const replaceFrom = '<App />'
    const replaceTo = '<Provider store={store}>\n<App />\n</Provider>'

    replaceText(resolve, replaceFrom, replaceTo)
  })
}

const addReactRouter = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Adding react router', 7)

    const replaceFrom = '<App />'
    const replaceTo = '<Router>\n<Route path="/" component={App} />\n</Router>'

    replaceText(resolve, replaceFrom, replaceTo)
  })
}

const replaceText = (resolve, replaceFrom, replaceTo) => {
  const options = {
    files: '../client/src/index.tsx',
    from: replaceFrom,
    to: replaceTo,
  }

  try {
    replace.sync(options)
    resolve(true)
  } catch (error) {
    console.error('Error occurred updating index.tsx:', error.red)
    resolve(false)
  }
}

const installDependencies = () => {
  return new Promise((resolve) => {
    logStepHeaderMessage('Installing client dependencies', 8)
    shell.cd(`${clientAppPath}`)

    console.log('Installing DEV dependencies')
    shell.exec(
      'npm install -D enzyme enzyme-adapter-react-16 axios-mock-adapter redux-mock-store prettier tslint tslint-config-prettier tslint-consistent-codestyle redux-devtools-extension redux-actions',
    )

    console.log('Installing dependencies')
    shell.exec(
      `npm install -S redux github:wgrisa/redux-thunk-actions react-redux redux-thunk react-router-dom axios platform qs store query-string`,
    )

    console.log('Installing @types')
    shell.exec(
      `npm install -D @types/react-redux @types/react-router-dom @types/platform @types/qs @types/store @types/query-string`,
    )

    console.log('Installing sass')
    shell.exec(`cd .. && npm run client-npm-i-sass`)

    resolve(true)
  })
}

const deleteUnnecessaryFiles = () => {
  logStepHeaderMessage('Removing unnecessary files', 9)
  const srcPath = `${clientAppPath}/src`
  const files = fs.readdirSync(srcPath)
  const isDirectory = (path) => fs.lstatSync(path).isDirectory()

  files.forEach((file) => {
    const fullFilePath = `${srcPath}/${file}`
    const whitelistFiles = ['index.tsx', 'index.scss', 'registerServiceWorker.ts']

    if (!whitelistFiles.includes(file) && !isDirectory(fullFilePath)) {
      console.log('deleting unnecessary file: ', file)
      fs.unlinkSync(fullFilePath)
    }
  })
}

const changeClientPackageFile = () => {
  logStepHeaderMessage('Update client package configuration', 10)
  const packagePath = `${clientAppPath}/package.json`
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

  packageContent.scripts['test-coverage'] = 'npm run test -- --coverage'
  ;(packageContent.jest = {
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!<rootDir>/node_modules/',
      '!<rootDir>/src/index.tsx',
      '!<rootDir>/src/registerServiceWorker.ts',
    ],
  }),
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2))
}

const showSuccessMessage = () => {
  const successMessage = `\nSetup success! Welcome to AE Node Boilerplate\n
Some stuff to do:\n
• commit right now if you want to have a baseline for the project.
• npm run dev to get the project going
• have fun!\n`.green

  console.log(successMessage)
}

const logStepHeaderMessage = (message, step) => {
  console.log(`\n${message}`.cyan)
  console.log(`[Step ${step}/${totalSteps}]\n`.yellow)
}

run()
