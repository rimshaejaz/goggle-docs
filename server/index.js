import { Server } from 'socket.io';

import mongoose from 'mongoose';
import 'dotenv/config';
import path from "path";
import express from 'express';

import { getDocument, updateDocument } from './controller/document-controller.js';

// Backend will run on port 9000
// Allow localhost:300 & GET POST
const PORT = process.env.PORT;
const app = express();

const io = new Server(PORT, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// -------------Deployment-----------
const _dirname1 = path.resolve()
if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(_dirname1, '/client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(_dirname1, "client", "build", "index.html"))
    })

} else {
    app.get("/", (req, res) => {
        res.send("API is running successfully.")
    });
}

// Database connection
mongoose 
.connect(process.env.MONGODB_CONNECT_STRING)
.then(() => console.log("Success: The database has been connected to MongoDB."))
.catch((err)=> console.log("ERROR. DB NOT CONNECTED."))

// Connection to handle frontend data in callback function by catching changes from delta 
// Broadcast changes to frontend based on specific document; if ids are the same, then display changes
io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        const document = await getDocument(documentId);

        socket.join(documentId);
        socket.emit('load-document', document.data);

        socket.on('send-changes', delta => {
            console.log('The server is connected.');
            console.log(delta);
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });
        socket.on('save-document', async data => {
            await updateDocument(documentId, data);
        });
    }); 
});
