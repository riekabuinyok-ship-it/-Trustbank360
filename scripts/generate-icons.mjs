// Generates PWA icons from the master SVG
// Run: node scripts/generate-icons.mjs

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs")
const { resolve } = require("path")

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const INPUT = resolve(__dirname, "../public/images/icons/icon.svg")
const OUTPUT_DIR = resolve(__dirname, "../public/images/icons")

async function generate() {
  console.log("PWA icon generation placeholder.")
  console.log("For production: install sharp and uncomment the sharp section below.")
  console.log("npm install sharp --save-dev")

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Generate a simple placeholder for each size
  // Replace with sharp-based PNG generation in production
  for (const size of SIZES) {
    const outPath = resolve(OUTPUT_DIR, `icon-${size}.png`)
    if (!existsSync(outPath)) {
      // Write an empty marker - will be replaced by actual PNG in production
      writeFileSync(outPath, "")
    }
  }

  console.log("Icons directory ready. Replace empty PNGs with actual generated icons for production.")
}

generate().catch(console.error)

/* Production version - install sharp first:
const sharp = require("sharp")
async function generate() {
  const svg = readFileSync(INPUT)
  for (const size of SIZES) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(resolve(OUTPUT_DIR, `icon-${size}.png`))
    console.log(`Generated ${size}x${size}`)
  }
}
*/
