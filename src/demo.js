// Test
import ClapDetector from './index'

const clap = new ClapDetector()
clap.addClapListener((props) => {
  console.log("debug clap !", props)
})
