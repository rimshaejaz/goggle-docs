import React from "react";
import { useEffect, useState } from "react";

import { Box } from '@mui/material';
import styled from "@emotion/styled";

import Quill from 'quill';
import 'quill/dist/quill.snow.css';

import { io } from 'socket.io-client';

import { useParams } from "react-router-dom";


// Implement css
const Component = styled.div`
    background: #F5F5F5;
`
const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // Toggled buttons
    ['blockquote', 'code-block'],
    ['link', 'image', 'video', 'formula'],
  
    [{ 'header': 1 }, { 'header': 2 }],               // Custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // Superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // Outdent/indent
    [{ 'direction': 'rtl' }],                         // Text direction
  
    [{ 'size': ['small', false, 'large', 'huge'] }],  // Custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // Dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
  
    ['clean']                                         // Remove formatting button
  ];

const Editor = () => {

    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const { id } = useParams();

    // Initialize Quill for CSS use, pass into setqUILL
    useEffect(() => {
        const quillServer = new Quill('#container', { theme: 'snow', modules: { toolbar: toolbarOptions }});
        //quillServer.disable();
        //quillServer.setText('Loading the document...');
        setQuill(quillServer);
    }, []);

    // Connection to backend, pass into setSocket
    useEffect(() => {
        const socketServer = io('http://localhost:9000');
        setSocket(socketServer);
        // When the component is unmounted, no longer a part of the UI, disconnect the connection to backend 
        return () => {
            socketServer.disconnect();
        }
    }, []);

    // Handles real time text-changes 
    // Delta detects all of the changes made 
    // .off and .on remove and add handler 
    useEffect(() => {
        // Check for Null and undefined 
        if (socket === null || quill === null )
            return;

        const handleChange = (delta, oldData, source) => {
            if (source !== 'user') 
                return;
                //return;
            // Send changes to backend 
            socket && socket.emit('send-changes', delta);
        }
        quill && quill.on('text-change', handleChange);

        return () => {
            quill && quill.off('text-change', handleChange);
        };
    },[quill, socket]);


    // Handle data sent by socket and displays on frontend 
    useEffect(() => {
        if (socket === null || quill === null )
            return;

        const handleChange = (delta) => {  
            // Update real-time changes to all locations through handleChanges
            quill.updateContents(delta);
        }
        socket && socket.on('receive-changes', handleChange);

        return () => {
            socket && socket.off('receive-changes', handleChange);
        };
    },[quill, socket]);

    // Handles changes being made to the pages with the same ids
    // If same id's changes are allowed, otherwise disabled 
    useEffect(()=> {
        if (quill === null || socket === null)
            return;

        socket && socket.once('load-docuemnt', document => {
            quill && quill.setContents(document);
            quill && quill.enable();
        })
        socket && socket.emit('get-document', id);
    }, [quill, socket, id]);

    // Saves data updated every 2 seconds as socket and quill changes 
    useEffect(() => {
        if (socket === null || quill === null)
            return;

            const interval = setInterval(() => {
                socket && socket.emit('save-document', quill.getContents())
            }, 2000);

            return () => {
                clearInterval(interval);
            }

    }, [socket, quill])

    return (
        <Component>
            <Box className='container' id='container'></Box>
        </Component>
    );
};

export default Editor;