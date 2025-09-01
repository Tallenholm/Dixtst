import fs from 'fs'
import path from 'path'

async function main() {
  const openapi: any = {
    openapi: '3.0.0',
    info: { title: 'Circadian Hue API', version: '1.0.0' },
    paths: {},
  }

  const docsDir = path.join(process.cwd(), 'docs')
  fs.mkdirSync(docsDir, { recursive: true })
  fs.writeFileSync(
    path.join(docsDir, 'openapi.json'),
    JSON.stringify(openapi, null, 2) + '\n'
  )

  fs.writeFileSync(path.join(docsDir, 'schema.graphql'), 'type Query {}\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
