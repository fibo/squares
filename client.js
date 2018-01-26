const socket = io()

const generateClientId = () => {
  let clientId = localStorage.getItem('clientId')

  if (clientId) {
    return clientId
  } else {
    clientId = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
    localStorage.setItem('clientId', clientId)
    return clientId
  }
}

const clientId = generateClientId()

console.log(clientId)

const run = {
  log: box => {
    console.log(`box ${box.id}`)
  }
}

socket.on('connect', () => {
  socket.emit('register', clientId)

  document.querySelectorAll('.box').forEach(box => {
    box.onclick = () => {
      socket.emit('desire', box.id)
    }
  })
})

socket.on('count', numUsers => {
  document.querySelector('.num-users').innerHTML = numUsers
})

socket.on('select', boxId => {
  console.log('select', boxId)
  const box = document.getElementById(boxId)

  box.classList.add('box--selected')
  run[box.dataset.action](box)
})

socket.on('lock', boxId => {
  console.log('lock', boxId)
  const box = document.getElementById(boxId)

  box.classList.add('box--locked')
  box.classList.remove('box--selected')
})

socket.on('unlock', boxId => {
  console.log('unlock', boxId)
  const box = document.getElementById(boxId)

  box.classList.remove('box--locked')
  box.classList.remove('box--selected')
})

socket.on('run', boxId => {
  const box = document.getElementById(boxId)

  run[box.dataset.action](box)
})

socket.on('sync', boxOf => {
  Object.keys(boxOf).forEach(userId => {
    const boxId = boxOf[userId]
    const box = document.getElementById(boxId)

    if (userId === clientId) {
      box.classList.add('box--selected')
    } else {
      box.classList.add('box--locked')
    }
  })
})

socket.on('disconnect', () => {
  document.querySelectorAll('.box').forEach(box => { box.onclick = null })
})
