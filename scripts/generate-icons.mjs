import sharp from "sharp"
import fs from "fs"

const svg = fs.readFileSync("public/images/logo.svg")
const sizes = [72, 96, 128, 144, 152, 192, 512]

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(`public/images/icons/icon-${size}.png`)
  console.log(`icon-${size}.png OK`)
}

for (const name of ["dashboard", "transfer", "sync"]) {
  await sharp(svg).resize(192, 192).png().toFile(`public/images/icons/${name}-192.png`)
  console.log(`${name}-192.png OK`)
}

console.log("DONE")
