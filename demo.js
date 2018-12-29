// Test
const ClapDetector = require('./lib').default

const test = new ClapDetector()
test.addClapListener((props) => {
  console.log("debug clap !", props)
})
