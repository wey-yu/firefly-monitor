console.panda = function(...args) { console.log("🐼", ...args) }
console.bear = function(...args) { console.log("🐻", ...args) }
console.fox = function(...args) { console.log("🦊", ...args) }
console.pig = function(...args) { console.log("🐷", ...args) }
console.happy = function(...args) { console.log("😀", ...args) }
console.angry = function(...args) { console.log("😡", ...args) }
console.good = function(...args) { console.log("👍", ...args) }
console.bad = function(...args) { console.log("👎", ...args) }

checkEqualityOfArrays = function(arr1, arr2) {
  return arr1 === undefined 
  ? false
  : arr2 === undefined 
  ? false
  : arr1.length != arr2.length 
  ? false
  : arr1.sort().join() == arr2.sort().join()
}

Array.prototype.isSameAs = function(arr) {
  return arr === undefined 
  ? false
  : this === undefined 
  ? false
  : arr.length != this.length 
  ? false
  : arr.sort().join() == this.sort().join()
}

Array.prototype.isNotSameAs = function(arr) {
  return !this.isSameAs(arr)
}