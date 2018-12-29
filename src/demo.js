// Test
import ClapDetector from './index'

const clap = new ClapDetector()
const listeners = [
  clap.addClapListener(props => {
    console.log("debug 1 clap", props)
  }, { number: 1, maxDelay: 0 }),
  clap.addClapListener(props => {
    console.log("debug 3 claps", props)
  }, { number: 3, maxDelay: 3000 })
]

// No more clap listener after 3000 ms
/*
setTimeout(() => {
  listeners.forEach(release => release())
}, 3000)
*/
