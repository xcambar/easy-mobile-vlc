const express = require('express')
const app = express()
const fs = require('fs-extra')
const pathModule = require('path')

const {
  STATIC_LOCATION,
  STATIC_ROOT_URL
} = process.env

if (!STATIC_LOCATION || !STATIC_ROOT_URL) {
  process.exit(1)
}

app.set('view engine', 'pug')

function walk (root) {
  return fs.readdirSync(root)
    .filter((name) => !name.startsWith('.')) // hidden files
    .filter((name) => {
      let stats = fs.statSync(pathModule.join(root, name))
      let isDirectory = stats.isDirectory()
      let isValidFile = stats.isFile() && name.match(/(mp4|mkv|avi|mov)$/)
      return isValidFile || isDirectory
    })
    .map((name) => {
      let url = STATIC_ROOT_URL +
        pathModule.join(root, name).replace(STATIC_LOCATION, '')
      return { url, name }
    })
}

app.get('*', async ({ path }, res) => {
  path = pathModule.join(STATIC_LOCATION, path)
  let exists = await fs.pathExists(path)
  if (!exists) {
    return res.status(404).send()
  }
  let stats = await fs.stat(path)
  if (stats.isFile()) {
    let location = path.replace(STATIC_LOCATION, '')
    return res.redirect(`${STATIC_ROOT_URL}/${location}`)
  }
  if (stats.isDirectory()) {
    return res.render('index', { structure: walk(path) })
  }
  res.status(404).send()
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
