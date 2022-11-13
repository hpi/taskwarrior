#!/usr/bin/node env

const { URLSearchParams } = require('url')
const { promisify } = require('util')
const fetch = require('node-fetch')
const { Command } = require('commander')
const fs = require('fs')
const dayjs = require('dayjs')
const { resolve } = require('path')
const server = require('server')

const program = new Command()

const { get } = server.router
const { send, status } = server.reply


process.on('unhandledRejection', onfatal)
process.on('uncaughtException', onfatal)

function onfatal(err) {
  console.log('fatal:', err.message)
  exit(1)
}

function exit(code) {
  process.nextTick(process.exit, code)
}

program
  .command('dump')
  .description('Dump to file')
  .option('-k, --apiKey [apiKey]', 'OAuth access token')
  .option('--export-format <format>', 'Export file format', '{date}-taskwarrior.json')
  .option('--export-path [path]', 'Export file path')
  .action(dump)

program.parseAsync(process.argv)

async function dump({
  apiKey,
  exportPath,
  exportFormat
}) {
  console.log("APIKEY:", apiKey, exportPath, exportFormat)
  let tasks
  let projects

  const filledExportFormat = exportFormat
    .replace('{date}', dayjs().format('YYYY-MM-DD'))

  const EXPORT_PATH = resolve(exportPath, filledExportFormat)

  try {
    const response = await fetch(`https://inthe.am/api/v2/tasks/`, {
        method: `GET`,
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      })

    const { tasks: _tasks } = await response.json()

    projects = _tasks.reduce((arr, task) => {
      arr.push(task.project)

      return arr
    }, [])

    tasks = _tasks
  } catch (e) {
    onfatal(e)
  }

  const dump = JSON.stringify({ tasks, projects })

  await promisify(fs.writeFile)(EXPORT_PATH, dump)
}
