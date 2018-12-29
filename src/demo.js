// Test
import ClapDetector from './index'

const clap = new ClapDetector()
const release = clap.addClapListener((props) => {
  console.log("debug clap !", props)
})

// No more clap listener after 3000 ms
setTimeout(() => release(), 3000)
