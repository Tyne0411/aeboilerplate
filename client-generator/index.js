#!/usr/bin/env node

const shell = require('shelljs')
const colors = require('colors')
const fs = require('fs')

const resources = ['.editorconfig', '.gitignore', '.prettierrc', 'tsconfig.json', 'tslint.json']
const clientGeneratorPath = `${process.cwd()}`
const clientAppPath = '../client'

const run = async () => {
  try {
    await createReactApp()
    await updateAppConfig()
    await openAppFolder()
    await installDependences()
    console.log('\nAll done'.green)
  } catch (error) {
    console.log(error, 'Something went wrong while trying to create a new React app using create-react-app'.red)
  }
}

const createReactApp = () => {
  return new Promise((resolve) => {
    console.log('\nRun create-react-app with TypeScript and SASS'.cyan)

    const createReactAppCommand = `create-react-app ${clientAppPath} --scripts-version="@petejkim/react-scripts-ts-sass" --use-npm`

    const onSuccess = () => {
      console.log('\nReact app created'.green)
      resolve(true)
    }

    shell.exec(createReactAppCommand, onSuccess)
  })
}

const updateAppConfig = () => {
  return new Promise((resolve) => {
    const configPromises = resources.map((resource) => copyResourceFile(resource))
    Promise.all(configPromises).then(() => {
      console.log('\nResources copied from generator to client'.cyan)
      resolve()
    })
  })
}

const copyResourceFile = (resource) => {
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

const openAppFolder = () => {
  return new Promise((resolve) => {
    shell.cd(`${clientAppPath}`)
    console.log('\nOpen client folder'.cyan)
    resolve(true)
  })
}

const installDependences = () => {
  return new Promise((resolve) => {
    console.log('\nInstalling DEV dependences'.cyan)
    shell.exec('npm install -D prettier tslint tslint-config-prettier tslint-consistent-codestyle')

    console.log('\nInstalling dependencies'.cyan)
    shell.exec(`npm install -S redux redux-thunk react-router-dom`)

    resolve(true)
  })
}

run()
