// const { request } = require('express');
const request = require('request')
const querystring = require('querystring')
const express = require('express')
const app = express();
const PORT = 3001;

const client_id = 'fb676ee83d04401a9645542130052688'
const client_secret = 'dcce6c96a47a45dd8b0978e4601be5e3'
const redirect_uri = 'http://localhost:3001/callback'

function generateRandomString(length){
    let text = ''
    let string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++){
        text += string.charAt(Math.floor(Math.random() * string.length))
    }
    return text;
}

app.get('/login', (req, res) => {

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
            
            //TEST IF WORKING - GET /V1/ME
            access_token = body.access_token;

            let options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            }

            request.get(options, (err, resp, body) => {
                res.send('Hello World')
                console.log('WORKING')
            })

        }
    })

})

app.get('/get_access_token', (req, res) => res.json(access_token))

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
            res.send({
                'access_token': body.access_token
            })
        }
    })

})

app.listen(PORT, () => console.log(`Listen on port ${PORT}`))