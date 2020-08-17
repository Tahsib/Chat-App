const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild

    const $newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt($newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    // Height of Messages Container
    const containerHeight = $messages.scrollHeight

    // How far I have scrolled?
    const scrollOffset = visibleHeight + $messages.scrollTop
    
    if(containerHeight - newMessageHeight <= scrollOffset ){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML('beforeend',html)   
    autoscroll()
})

socket.on('roomData',({room,users})=>{
   const html = Mustache.render(sidebarTemplate,{
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML = html
})

socket.on('locationMessage',(url)=>{
    console.log(url);
    const html = Mustache.render(locationMessageTemplate,{
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

$messageForm.addEventListener('submit',(e)=>{
    $messageFormButton.setAttribute('disabled','disabled')
    e.preventDefault()
    const message = e.target.elements.message.value  
      
    socket.emit('sendMessage',message,(error)=>{
        //console.log('The message was delivered (client)');
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error);
        }
        console.log('Delivered! (server)');
    })
})

$sendLocationButton.addEventListener('click',()=>{
    
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const location = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }
        //console.log(location);
        socket.emit('sendLocation',location, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!');
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href="/"
    }
})