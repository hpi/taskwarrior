#!/usr/bin/env node

/**
 * CLI to dump all local Taskwarrior tasks to a file as JSON.
 */

const { promisify } = require('util')
const { Command } = require('commander')
const fs = require('fs')
const dayjs = require('dayjs')
const { resolve } = require('path')
const { exec } = require('child_process')

const program = new Command()

// Handle fatal errors
process.on('unhandledRejection', onfatal)
process.on('uncaughtException', onfatal)

/**
 * Log fatal error and exit
 * @param {Error} err
 */
function onfatal(err) {
  console.error('fatal:', err.message)
  exit(1)
}

/**
 * Exit the process
 * @param {number} code
 */
function exit(code) {
  process.nextTick(() => process.exit(code))
}

// CLI definition
program
  .command('dump')
  .description('Dump all local Taskwarrior tasks to a file')
  .option('--export-format <format>', 'Export file format', '{date}-taskwarrior.json')
  .option('--export-path <path>', 'Export file path', '.')
  .action(dump)

program.parseAsync(process.argv)

/**
 * Dump local tasks to file
 * @param {object} options
 * @param {string} options.exportFormat
 * @param {string} options.exportPath
 */
async function dump({ exportFormat, exportPath }) {
  const filename = exportFormat.replace('{date}', dayjs().format('YYYY-MM-DD'))
  const outputPath = resolve(exportPath, filename)

  try {
    const tasks = await new Promise((resolve, reject) => {
      exec('task export', (err, stdout) => {
        if (err) return reject(err)
        try {
          resolve(JSON.parse(stdout))
        } catch (parseErr) {
          reject(parseErr)
        }
      })
    })

    const projects = tasks.reduce((acc, task) => {
      if (task.project) {
        acc.push(task.project)
      }
      return acc
    }, [])

    const contents = JSON.stringify({ tasks, projects })
    await promisify(fs.writeFile)(outputPath, contents)
  } catch (err) {
    onfatal(err)
  }
}

