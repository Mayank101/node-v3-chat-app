const socket  = io()

// socket.on('countUpdated', (count) =>{
//     console.log('The count has been updated!', count)
// })

// const bClick = document.querySelector('#increment')

// bClick.addEventListener('click', ()=>{
//     console.log('Clicked!')
//     socket.emit('increment')
// })

const messageForm = document.querySelector('#message-form')
const messageFormButton = messageForm.querySelector('button')
const sendInput =  document.querySelector('input')
const messageDiv = document.querySelector('#messages')
const sidebarDiv = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix:true
})

const autoscroll = () =>{

    //new message element
    const newMessage = messageDiv.lastElementChild

    //height of the new mesage
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = messageDiv.offsetHeight

    //height of messages container
    const containerHeight = messageDiv.scrollHeight

    //how far have I scrolled?
    const scrollOffset = messageDiv.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        messageDiv.scrollTop = messageDiv.scrollHeight
    }
}

socket.on('message', (welcomeMessage) =>{
    console.log(welcomeMessage)
    const html = Mustache.render(messageTemplate,{
        username:welcomeMessage.username,
        message:welcomeMessage.text,
        createdAt:moment(welcomeMessage.createdAt).format('h:mm A')
    })
    messageDiv.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('locationMessage', (locationUrl) => {
    console.log(locationUrl)
    const html = Mustache.render(locationTemplate, {
        username:locationUrl.username,
        locationUrl:locationUrl.url,
        createdAt:moment(locationUrl.createdAt).format('h:mm A')
    })
    messageDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData',({room, users}) =>{
    console.log(room)
    console.log(users)
    const html = Mustache.render(sidebarTemplate,{
        room:room,
        users:users
    })
    sidebarDiv.innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    messageFormButton.setAttribute('disabled','disabled')
    const message = sendInput.value 
    socket.emit('sendMessage',message,(error)=>{
        messageFormButton.removeAttribute('disabled')
        sendInput.value = ''
        sendInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})


const sendLocationButton = document.querySelector('#send-location')

sendLocationButton.addEventListener('click', () =>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) =>{
        // console.log(position.coords)
        const location = {
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        }
        socket.emit('sendLocation',location,()=>{
            sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})


socket.emit('join', {username, room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})