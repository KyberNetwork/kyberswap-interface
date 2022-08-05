// https://stackoverflow.com/questions/36523448/how-do-i-tell-if-a-user-is-using-brave-as-their-browser
let isBraveBrowser = false
;(() => {
  const check = async () => {
    const result = (navigator.brave && (await navigator.brave.isBrave())) || false
    isBraveBrowser = result
  }
  check()
})()

const checkForBraveBrowser = () => {
  return isBraveBrowser
}

// this func should be called inside a component to make sure isBraveBrowser is updated
export default checkForBraveBrowser
