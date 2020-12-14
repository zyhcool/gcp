
// 勿删！
// 勿删！
// const crypto = require("crypto")
// console.log(crypto.createHash('sha256').update('S0urG1ug').digest('hex'))
// 勿删！
// 勿删！




let arr = [['java', 'c++'], ['machine learning', 'data']]
let arr1 = [[['python', 'matlab', '.net'], 'golang'], ['js', 'perl'], 'happy']


// function func(arr) {
//     let s = ""
//     const len = arr.length
//     let hasArray = false
//     for (let i = 0; i < len; i++) {
//         if (arr[i] instanceof Array) {
//             hasArray = true
//             break
//         }
//     }
//     // 元素无array
//     if (!hasArray) {
//         return arr.join(' or ')
//     }
//     // 元素有array
//     for (let i = 0; i < len; i++) {
//         if (i === 0 && arr[0] instanceof Array) {
//             s = func(arr[0])
//             continue
//         }
//         else if (i === 0 && typeof arr[0] === "string") {
//             s = arr[0]
//             continue
//         }
//         if (arr[i] instanceof Array) {
//             s += " and " + func(arr[i])
//             // continue
//         }
//         else if (typeof arr[i] === 'string') {
//             s += " and " + arr[i]
//             // continue
//         }
//     }
//     return s
// }

// console.log(func(arr1))


function func(arr) {
    const len = arr.length
    let s = ""
    let hasArray = false
    for (let i = 0; i < len; i++) {
        if (arr[i] instanceof Array) {
            hasArray = true
            break
        }
    }
    // 元素无array
    if (!hasArray) {
        return arr.join(' or ')
    }
    // 元素有array
    for (let i = 0; i < len; i++) {
        if (i === 0 && arr[0] instanceof Array) {
            s = func(arr[0])
            continue
        }
        if (i === 0 && typeof arr[0] === "string") {
            s = arr[0]
            continue
        }
        if (arr[i] instanceof Array) {
            s = s + " and " + func(arr[i])
        }
        else if (typeof arr[i] === 'string') {
            s = s + " and " + arr[i]
        }
    }
    return s
}

console.log(func(arr))