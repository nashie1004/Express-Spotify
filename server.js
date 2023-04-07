const request = require('request')
const querystring = require('querystring')
const express = require('express')
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors')
app.use(cors())

const client_id = process.env.CLIENT_ID.toString()
const client_secret = process.env.CLIENT_SECRET.toString()
console.log(client_id, client_secret)
const redirect_uri = 'https://spotify2express.onrender.com/' //'http://localhost:3001/callback'

function generateRandomString(length){
    let text = ''
    let string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++){
        text += string.charAt(Math.floor(Math.random() * string.length))
    }
    return text;
}

app.get('/', (req, res) => {

    let state = generateRandomString(16);
    let scope = `
    user-read-playback-state user-modify-playback-state user-read-currently-playing
    playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public
    user-read-playback-position user-top-read user-read-recently-played
    user-library-modify user-library-read user-read-email user-read-private user-follow-modify user-follow-read`

    res.redirect('https://accounts.spotify.com/authorize?' + 
        querystring.stringify({
            response_type: 'code',
            client_id,
            scope,
            redirect_uri,
            state
        })
    )
})

let access_token;

app.get('/callback', (req, res) => {

    let code = req.query.code;

    let options = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code,
            redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {      
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    }

    request.post(options, (err, response, body) => {
        if (!err && response.statusCode == 200){
            
            access_token = body.access_token;

            console.log(`REDIRECT TO REACT, TOKEN: ${access_token}`)
            res.redirect('https://spotify2react.onrender.com');

        }
    })

})

app.get('/get_access_token', (req, res) => {
    access_token ? console.log('Token OK') : console.log('Token Expired')
    res.json({
        access_token
    })
})

app.get('/refresh_token', (req, res) => {
    
    //REQ.BODY SHOULD HAVE 'REFRESH_TOKEN', RETURNS NEW ACCESS_TOKEN
    let refresh_token = req.query.refresh_token;

    let options = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token
        },
        json: true
    }

    request.post(options, (err, response, body) => {
        if (!err && response.statusCode === 200){
            res.json({
                'access_token': body.access_token
            })
        }
    })

})

app.listen(PORT, () => console.log(`Listen on port ${PORT}`))