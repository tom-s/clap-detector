// Test
import ClapDetector from './index'

const clap = new ClapDetector()
const oneClapListener = clap.addClapsListener(props => {
  console.log("debug 1 clap force", props)
}, { number: 1, delay: 0, force: true })

const oneClapForceListener = clap.addClapsListener(props => {
  console.log("debug 1 clap", props)
}, { number: 1, delay: 1000 })

const twoClapsListener = clap.addClapsListener(props => {
  console.log("debug 2 claps", props)
}, { number: 2, delay: 1000 })

const threeClapsListener = clap.addClapsListener(props => {
  console.log("debug 3 claps", props)
}, { number: 3, delay: 1000 })

// Example: canceling clap listeners
// Cancel alls claps listener but 2 claps after 10 seconds
setTimeout(() => {
  oneClapListener()
  oneClapForceListener()
  threeClapsListener()
}, 10000)
