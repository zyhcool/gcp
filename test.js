

function ite1(n) {
    console.log(n)
    if (n === 60000) return
    process.nextTick(ite1, ++n)
}



function ite2(n) {
    console.log(n)
    if (n === 60000) return
    setTimeout(() => {
        ite2(++n)
    }, 0);
}

// ite2(0)


